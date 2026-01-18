"""
Chicken Road Data Collector
Collects game data from Evoplay Chicken Road
"""

import asyncio
import json
import sqlite3
from datetime import datetime
from playwright.async_api import async_playwright
import hashlib
import os

DATABASE_PATH = os.getenv("DATABASE_PATH", "../api/chickenroad.db")

CHICKENROAD_URLS = [
    "https://demo.evoplay.games/chickenroad",
]

class ChickenRoadCollector:
    def __init__(self):
        self.db_conn = None
        self.current_game = None

    def init_database(self):
        self.db_conn = sqlite3.connect(DATABASE_PATH)
        cursor = self.db_conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chickenroad_games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT UNIQUE NOT NULL,
                lanes_crossed INTEGER NOT NULL,
                final_multiplier REAL NOT NULL,
                outcome TEXT NOT NULL,
                hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chicken_lanes ON chickenroad_games(lanes_crossed)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chicken_outcome ON chickenroad_games(outcome)")
        self.db_conn.commit()

    def save_game(self, game_id: str, lanes_crossed: int, final_multiplier: float, outcome: str, hash_value: str = None):
        try:
            cursor = self.db_conn.cursor()
            cursor.execute(
                "INSERT OR IGNORE INTO chickenroad_games (game_id, lanes_crossed, final_multiplier, outcome, hash) VALUES (?, ?, ?, ?, ?)",
                (game_id, lanes_crossed, final_multiplier, outcome, hash_value)
            )
            self.db_conn.commit()
            emoji = "🐔✅" if outcome == "crossed" else "🐔💀"
            print(f"[Chicken Road] {emoji} Lanes: {lanes_crossed}, {final_multiplier}x - {outcome}")
            return True
        except Exception as e:
            print(f"[Chicken Road] Error: {e}")
            return False

    async def handle_websocket(self, ws):
        print(f"[Chicken Road] WebSocket connected")
        def on_message(message):
            try:
                data = json.loads(message)
                msg_type = data.get("type") or data.get("action")

                if msg_type in ["game_start", "start"]:
                    self.current_game = {
                        "id": data.get("gameId") or hashlib.md5(datetime.now().isoformat().encode()).hexdigest()[:12],
                        "lanes": 0,
                        "multiplier": 1.0
                    }
                elif msg_type in ["cross", "safe", "lane_cleared"]:
                    if self.current_game:
                        self.current_game["lanes"] += 1
                        self.current_game["multiplier"] = data.get("multiplier", 1.0)
                elif msg_type in ["hit", "crash", "game_over"]:
                    if self.current_game:
                        self.save_game(self.current_game["id"], self.current_game["lanes"], 0, "hit")
                        self.current_game = None
                elif msg_type in ["cashout", "collect"]:
                    if self.current_game:
                        mult = data.get("multiplier") or self.current_game["multiplier"]
                        self.save_game(self.current_game["id"], self.current_game["lanes"], mult, "crossed")
                        self.current_game = None
                elif msg_type == "history":
                    for g in data.get("games", []):
                        if g.get("lanes"):
                            self.save_game(str(g.get("id", "")), g["lanes"], g.get("multiplier", 0),
                                         "crossed" if g.get("won") else "hit")
            except: pass
        ws.on("framereceived", lambda p: on_message(p))

    async def collect_from_url(self, url: str, duration_minutes: int = 60):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await (await browser.new_context()).new_page()
            page.on("websocket", self.handle_websocket)
            try:
                await page.goto(url, wait_until="networkidle", timeout=60000)
            except:
                await browser.close()
                return
            end_time = datetime.now().timestamp() + (duration_minutes * 60)
            while datetime.now().timestamp() < end_time:
                await asyncio.sleep(10)
            await browser.close()

    async def run(self, duration_minutes: int = 60):
        self.init_database()
        await asyncio.gather(*[self.collect_from_url(url, duration_minutes) for url in CHICKENROAD_URLS])
        if self.db_conn: self.db_conn.close()

if __name__ == "__main__":
    asyncio.run(ChickenRoadCollector().run(60))
