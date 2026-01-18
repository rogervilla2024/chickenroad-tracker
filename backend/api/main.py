"""
Chicken Road Tracker - Backend API

FastAPI application for serving road crossing game statistics.
This module provides REST API endpoints for accessing Chicken Road game data
including games, statistics, and distribution analysis.

Author: Crash Games Team
Version: 1.0.0
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional

import aiosqlite
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Game-specific statistics
from game_stats import create_grid_game_router


# =============================================================================
# Logging Configuration
# =============================================================================

def setup_logger(name: str) -> logging.Logger:
    """
    Configure and return a logger with structured formatting.

    Args:
        name: The name of the logger (typically __name__).

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"logger": "%(name)s", "module": "%(module)s", '
            '"function": "%(funcName)s", "line": %(lineno)d, '
            '"message": "%(message)s"}'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = setup_logger(__name__)


# =============================================================================
# Configuration
# =============================================================================

# Database path from environment variable with default fallback
DATABASE_PATH: str = os.getenv("DATABASE_PATH", "chickenroad.db")

# CORS allowed origins - configurable via environment
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:3001",
    os.getenv("FRONTEND_URL", "https://chickenroadtracker.com"),
    os.getenv("SECONDARY_DOMAIN", "https://www.chickenroadtracker.com"),
]

# Constants for lanes crossed distribution buckets
DISTRIBUTION_BUCKETS: List[tuple] = [
    ("1 lane", "= 1"),
    ("2-3 lanes", "BETWEEN 2 AND 3"),
    ("4-5 lanes", "BETWEEN 4 AND 5"),
    ("6-7 lanes", "BETWEEN 6 AND 7"),
    ("8-9 lanes", "BETWEEN 8 AND 9"),
    ("10+ lanes", ">= 10"),
]


# =============================================================================
# Pydantic Models
# =============================================================================

class ChickenRoadGame(BaseModel):
    """
    Represents a single game round.

    Attributes:
        game_id: Unique identifier for the game.
        lanes_crossed: Number of lanes successfully crossed.
        final_multiplier: The final multiplier value achieved.
        outcome: Game outcome ('crossed' or 'hit').
        hash: Optional hash for provably fair verification.
        created_at: Timestamp when the game was recorded.
    """
    game_id: str = Field(..., description="Unique identifier for the game")
    lanes_crossed: int = Field(..., ge=0, description="Number of lanes crossed")
    final_multiplier: float = Field(..., ge=0, description="Final multiplier value")
    outcome: str = Field(..., description="Game outcome (crossed/hit)")
    hash: Optional[str] = Field(None, description="Provably fair hash")
    created_at: datetime = Field(..., description="Timestamp when game was recorded")


class GamesResponse(BaseModel):
    """
    Response model for paginated games endpoint.

    Attributes:
        items: List of ChickenRoadGame objects.
        total: Total number of games in the database.
    """
    items: List[ChickenRoadGame] = Field(..., description="List of game rounds")
    total: int = Field(..., ge=0, description="Total number of games")


class SummaryStats(BaseModel):
    """
    Summary statistics for all game rounds.

    Attributes:
        total_games: Total number of games played.
        avg_lanes_crossed: Average lanes crossed across all games.
        avg_multiplier: Average final multiplier value.
        success_rate: Percentage of games with successful crossings.
        max_lanes_crossed: Maximum lanes crossed in a single game.
        median_lanes_crossed: Median lanes crossed value.
        total_hits: Number of games ending in hit.
        total_crossed: Number of games ending in crossed.
    """
    total_games: int = Field(..., ge=0, description="Total number of games")
    avg_lanes_crossed: float = Field(..., ge=0, description="Average lanes crossed")
    avg_multiplier: float = Field(..., ge=0, description="Average final multiplier")
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage")
    max_lanes_crossed: int = Field(..., ge=0, description="Maximum lanes crossed")
    median_lanes_crossed: float = Field(..., ge=0, description="Median lanes crossed")
    total_hits: int = Field(..., ge=0, description="Total games ending in hit")
    total_crossed: int = Field(..., ge=0, description="Total games ending in crossed")


class RecentStats(BaseModel):
    """
    Statistics for recent game rounds.

    Attributes:
        avg_lanes_crossed: Average lanes crossed for recent games.
        success_rate: Success rate percentage for recent games.
        avg_multiplier: Average multiplier for recent games.
    """
    avg_lanes_crossed: float = Field(..., ge=0, description="Average lanes crossed for recent games")
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage")
    avg_multiplier: float = Field(..., ge=0, description="Average multiplier for recent games")


class DistributionBucket(BaseModel):
    """
    Represents a bucket in the lanes crossed distribution.

    Attributes:
        range: Human-readable range label (e.g., "2-3 lanes").
        count: Number of games in this range.
        percentage: Percentage of total games in this range.
    """
    range: str = Field(..., description="Lanes range label")
    count: int = Field(..., ge=0, description="Number of games in range")
    percentage: float = Field(..., ge=0, le=100, description="Percentage of total games")


class HealthResponse(BaseModel):
    """
    Health check response model.

    Attributes:
        status: Current health status ('healthy' or 'unhealthy').
        game: Name of the game being tracked.
        provider: Game provider name.
        rtp: Return to player percentage.
        database: Database connection status.
        last_data_update: Timestamp of most recent data.
        timestamp: Current server timestamp.
    """
    status: str = Field(..., description="Health status")
    game: str = Field(..., description="Game name")
    provider: str = Field(..., description="Game provider")
    rtp: str = Field(..., description="Return to player percentage")
    database: str = Field(..., description="Database connection status")
    last_data_update: Optional[str] = Field(None, description="Last data update timestamp")
    timestamp: str = Field(..., description="Current server timestamp")


class ErrorResponse(BaseModel):
    """
    Standardized error response model.

    Attributes:
        error: Error type identifier.
        detail: Human-readable error description.
        timestamp: When the error occurred.
        request_id: Optional request tracking ID.
    """
    error: str = Field(..., description="Error type identifier")
    detail: str = Field(..., description="Error description")
    timestamp: str = Field(..., description="Error timestamp")
    request_id: Optional[str] = Field(None, description="Request tracking ID")


# =============================================================================
# Database Connection Management
# =============================================================================

class DatabaseManager:
    """
    Manages database connections using context managers for proper cleanup.

    This class provides async context manager for database connections,
    ensuring connections are properly closed after use.
    """

    def __init__(self, db_path: str) -> None:
        """
        Initialize the database manager.

        Args:
            db_path: Path to the SQLite database file.
        """
        self.db_path = db_path

    @asynccontextmanager
    async def connect(self) -> AsyncGenerator[aiosqlite.Connection, None]:
        """
        Get a database connection using async context manager.

        Yields:
            aiosqlite.Connection: Database connection with Row factory set.

        Raises:
            DatabaseError: If connection cannot be established.
        """
        db: Optional[aiosqlite.Connection] = None
        try:
            db = await aiosqlite.connect(self.db_path)
            db.row_factory = aiosqlite.Row
            logger.debug(f"Database connection established to {self.db_path}")
            yield db
        except aiosqlite.Error as e:
            logger.error(f"Database connection error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Database connection failed"
            ) from e
        finally:
            if db:
                await db.close()
                logger.debug("Database connection closed")


# Create singleton database manager
db_manager = DatabaseManager(DATABASE_PATH)


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Dependency function for database connection injection.

    Yields:
        aiosqlite.Connection: Database connection.

    Example:
        @app.get("/api/data")
        async def get_data(db: aiosqlite.Connection = Depends(get_db)):
            cursor = await db.execute("SELECT * FROM table")
    """
    async with db_manager.connect() as db:
        yield db


# =============================================================================
# FastAPI Application Setup
# =============================================================================

app = FastAPI(
    title="Chicken Road Tracker API",
    description="Real-time statistics API for Evoplay Chicken Road game",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# =============================================================================
# CORS Configuration (Security Fix)
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # API doesn't require credentials
    allow_methods=["GET", "HEAD", "OPTIONS"],  # Read-only API
    allow_headers=["Content-Type", "Accept"],
    expose_headers=["Content-Length", "Content-Range"],
    max_age=3600,
)


# =============================================================================
# Exception Handlers
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for unhandled exceptions.

    Args:
        request: The incoming request that caused the exception.
        exc: The exception that was raised.

    Returns:
        JSONResponse: Standardized error response with 500 status code.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    error_response = ErrorResponse(
        error="internal_error",
        detail="An internal server error occurred",
        timestamp=datetime.utcnow().isoformat(),
        request_id=request.headers.get("X-Request-ID")
    )
    return JSONResponse(
        status_code=500,
        content=error_response.model_dump()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handler for HTTP exceptions.

    Args:
        request: The incoming request.
        exc: The HTTPException that was raised.

    Returns:
        JSONResponse: Standardized error response.
    """
    logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
    error_response = ErrorResponse(
        error="http_error",
        detail=str(exc.detail),
        timestamp=datetime.utcnow().isoformat(),
        request_id=request.headers.get("X-Request-ID")
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump()
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """
    Handler for validation errors.

    Args:
        request: The incoming request.
        exc: The ValueError that was raised.

    Returns:
        JSONResponse: Standardized error response with 422 status code.
    """
    logger.warning(f"Validation error: {exc}")
    error_response = ErrorResponse(
        error="validation_error",
        detail=str(exc),
        timestamp=datetime.utcnow().isoformat(),
        request_id=request.headers.get("X-Request-ID")
    )
    return JSONResponse(
        status_code=422,
        content=error_response.model_dump()
    )


# =============================================================================
# Startup Event
# =============================================================================

@app.on_event("startup")
async def startup() -> None:
    """
    Application startup event handler.

    Creates the database table and indexes if they don't exist.
    Logs the startup process for monitoring.
    """
    logger.info("Starting Chicken Road Tracker API...")

    try:
        async with db_manager.connect() as db:
            # Create main table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS chickenroad_rounds (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_id TEXT UNIQUE NOT NULL,
                    lanes_crossed INTEGER NOT NULL,
                    final_multiplier REAL NOT NULL,
                    outcome TEXT NOT NULL,
                    hash TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create indexes for performance
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_lanes ON chickenroad_rounds(lanes_crossed)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_created ON chickenroad_rounds(created_at DESC)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_game_id ON chickenroad_rounds(game_id)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_outcome ON chickenroad_rounds(outcome)"
            )

            await db.commit()
            logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
        raise


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/api/games", response_model=GamesResponse)
async def get_games(
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Maximum number of games to return (1-500)"
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of games to skip (must be >= 0)"
    ),
    db: aiosqlite.Connection = Depends(get_db)
) -> GamesResponse:
    """
    Get paginated list of game rounds.

    Retrieves game rounds ordered by creation time (most recent first).
    Supports pagination through limit and offset parameters.

    Args:
        limit: Maximum number of games to return (default: 50, max: 500).
        offset: Number of games to skip for pagination (default: 0).
        db: Database connection (injected).

    Returns:
        GamesResponse: Paginated list of games with total count.

    Raises:
        HTTPException: If database query fails.

    Example:
        GET /api/games?limit=100&offset=0
        Response: {"items": [...], "total": 5000}
    """
    logger.debug(f"Fetching games with limit={limit}, offset={offset}")

    try:
        # Get total count
        cursor = await db.execute("SELECT COUNT(*) FROM chickenroad_rounds")
        total = (await cursor.fetchone())[0]

        # Get paginated games
        cursor = await db.execute(
            """
            SELECT game_id, lanes_crossed, final_multiplier, outcome, hash, created_at
            FROM chickenroad_rounds
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset)
        )
        rows = await cursor.fetchall()

        items = [
            ChickenRoadGame(
                game_id=row["game_id"],
                lanes_crossed=row["lanes_crossed"],
                final_multiplier=row["final_multiplier"],
                outcome=row["outcome"],
                hash=row["hash"],
                created_at=row["created_at"]
            )
            for row in rows
        ]

        logger.info(f"Retrieved {len(items)} games (total: {total})")
        return GamesResponse(items=items, total=total)

    except aiosqlite.Error as e:
        logger.error(f"Database error fetching games: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch games from database"
        ) from e


@app.get("/api/stats/summary", response_model=SummaryStats)
async def get_summary(db: aiosqlite.Connection = Depends(get_db)) -> SummaryStats:
    """
    Get summary statistics for all game rounds.

    Calculates aggregate statistics including average, median, max
    lanes crossed and success rate.

    Args:
        db: Database connection (injected).

    Returns:
        SummaryStats: Aggregate statistics for all games.

    Raises:
        HTTPException: If database query fails.

    Example:
        GET /api/stats/summary
        Response: {"total_games": 5000, "avg_lanes_crossed": 4.2, ...}
    """
    logger.debug("Fetching summary statistics")

    try:
        # Get main statistics in a single query
        cursor = await db.execute("""
            SELECT
                COUNT(*) as total,
                AVG(lanes_crossed) as avg_lanes,
                AVG(final_multiplier) as avg_mult,
                MAX(lanes_crossed) as max_lanes,
                SUM(CASE WHEN outcome = 'hit' THEN 1 ELSE 0 END) as total_hits,
                SUM(CASE WHEN outcome = 'crossed' THEN 1 ELSE 0 END) as total_crossed
            FROM chickenroad_rounds
        """)
        row = await cursor.fetchone()

        # Calculate median
        cursor = await db.execute("""
            SELECT lanes_crossed FROM chickenroad_rounds
            ORDER BY lanes_crossed
            LIMIT 1 OFFSET (SELECT COUNT(*) FROM chickenroad_rounds) / 2
        """)
        median_row = await cursor.fetchone()
        median = median_row[0] if median_row else 0.0

        total = row[0] or 0
        total_crossed = row[5] or 0
        success_rate = round((total_crossed / total) * 100, 2) if total > 0 else 0.0

        result = SummaryStats(
            total_games=total,
            avg_lanes_crossed=round(row[1] or 0, 4),
            avg_multiplier=round(row[2] or 0, 4),
            success_rate=success_rate,
            max_lanes_crossed=row[3] or 0,
            median_lanes_crossed=round(median, 4),
            total_hits=row[4] or 0,
            total_crossed=total_crossed
        )

        logger.info(f"Summary stats: {result.total_games} total games")
        return result

    except aiosqlite.Error as e:
        logger.error(f"Database error fetching summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch summary statistics"
        ) from e


@app.get("/api/stats/recent", response_model=RecentStats)
async def get_recent_stats(
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
        description="Number of recent games to analyze (1-1000)"
    ),
    db: aiosqlite.Connection = Depends(get_db)
) -> RecentStats:
    """
    Get statistics for recent game rounds.

    Analyzes the most recent N games to provide current trend data.

    Args:
        limit: Number of recent games to analyze (default: 100, max: 1000).
        db: Database connection (injected).

    Returns:
        RecentStats: Statistics for recent games.

    Raises:
        HTTPException: If database query fails.

    Example:
        GET /api/stats/recent?limit=500
        Response: {"avg_lanes_crossed": 4.5, "success_rate": 35.2, ...}
    """
    logger.debug(f"Fetching recent stats for last {limit} games")

    try:
        cursor = await db.execute("""
            SELECT
                AVG(lanes_crossed) as avg_lanes,
                AVG(final_multiplier) as avg_mult,
                SUM(CASE WHEN outcome = 'crossed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
            FROM (
                SELECT lanes_crossed, final_multiplier, outcome
                FROM chickenroad_rounds
                ORDER BY created_at DESC
                LIMIT ?
            )
        """, (limit,))
        row = await cursor.fetchone()

        result = RecentStats(
            avg_lanes_crossed=round(row[0] or 0, 4),
            avg_multiplier=round(row[1] or 0, 4),
            success_rate=round(row[2] or 0, 2)
        )

        logger.info(f"Recent stats (last {limit}): avg_lanes={result.avg_lanes_crossed}")
        return result

    except aiosqlite.Error as e:
        logger.error(f"Database error fetching recent stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch recent statistics"
        ) from e


@app.get("/api/distribution", response_model=List[DistributionBucket])
async def get_distribution(
    db: aiosqlite.Connection = Depends(get_db)
) -> List[DistributionBucket]:
    """
    Get lanes crossed distribution across predefined ranges.

    Returns the count and percentage of games that fall into each
    lanes range bucket for visualization and analysis.

    Args:
        db: Database connection (injected).

    Returns:
        List[DistributionBucket]: Distribution data for each range bucket.

    Raises:
        HTTPException: If database query fails.

    Example:
        GET /api/distribution
        Response: [
            {"range": "1 lane", "count": 300, "percentage": 6.0},
            {"range": "2-3 lanes", "count": 1500, "percentage": 30.0},
            ...
        ]
    """
    logger.debug("Fetching lanes crossed distribution")

    try:
        # Get total count first
        cursor = await db.execute("SELECT COUNT(*) FROM chickenroad_rounds")
        total = (await cursor.fetchone())[0] or 1  # Avoid division by zero

        result: List[DistributionBucket] = []

        # Query each bucket
        for name, condition in DISTRIBUTION_BUCKETS:
            cursor = await db.execute(
                f"SELECT COUNT(*) FROM chickenroad_rounds WHERE lanes_crossed {condition}"
            )
            count = (await cursor.fetchone())[0]
            percentage = round((count / total) * 100, 2)

            result.append(DistributionBucket(
                range=name,
                count=count,
                percentage=percentage
            ))

        logger.info(f"Distribution calculated for {total} games")
        return result

    except aiosqlite.Error as e:
        logger.error(f"Database error fetching distribution: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch distribution data"
        ) from e


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """
    Health check endpoint for monitoring and orchestration.

    Checks database connectivity and returns the service health status
    along with the timestamp of the most recent data update.

    Returns:
        HealthResponse: Service health status and metadata.

    Example:
        GET /api/health
        Response: {
            "status": "healthy",
            "game": "chickenroad",
            "provider": "Evoplay",
            "rtp": "96%",
            "database": "connected",
            "last_data_update": "2026-01-17T10:30:00",
            "timestamp": "2026-01-17T10:35:00"
        }
    """
    logger.debug("Health check requested")

    try:
        async with db_manager.connect() as db:
            # Check database connectivity and get last update time
            cursor = await db.execute(
                "SELECT MAX(created_at) FROM chickenroad_rounds"
            )
            last_update_row = await cursor.fetchone()
            last_update = last_update_row[0] if last_update_row and last_update_row[0] else None

            response = HealthResponse(
                status="healthy",
                game="chickenroad",
                provider="Evoplay",
                rtp="96%",
                database="connected",
                last_data_update=str(last_update) if last_update else "No data",
                timestamp=datetime.utcnow().isoformat()
            )

            logger.info("Health check: healthy")
            return response

    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return HealthResponse(
            status="unhealthy",
            game="chickenroad",
            provider="Evoplay",
            rtp="96%",
            database="disconnected",
            last_data_update=None,
            timestamp=datetime.utcnow().isoformat()
        )


# =============================================================================
# Main Entry Point
# =============================================================================


# Game-specific statistics router
grid_stats_router = create_grid_game_router(db_manager, "chickenroad", "chickenroad")
app.include_router(grid_stats_router)


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Chicken Road Tracker API server...")
    uvicorn.run(app, host="0.0.0.0", port=8013)
