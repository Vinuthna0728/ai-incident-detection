from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
import traceback
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# ROUTES
from routes import log_routes, incident_routes, auth_routes

# SERVICES
from services.websocket_manager import manager
from services.anomaly import generate_metrics, detect_anomaly, generate_incident

# DATABASE
import database.db as db

engine = db.engine


# =========================
# 🚀 APP FACTORY
# =========================
def create_app():
    app = FastAPI(title="AI Ops Incident Detection API")

    # ---------------- ROUTES ----------------
    app.include_router(log_routes.router)
    app.include_router(incident_routes.router)
    app.include_router(auth_routes.router)

    # ---------------- CORS ----------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---------------- TEST DB ROUTE (FIXED) ----------------
    @app.get("/test-db")
    def test_db():
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return {"status": "✅ MySQL Connected"}
        except Exception as e:
            return {"error": str(e)}

    # ---------------- WEBSOCKET ----------------
    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        print("🔌 WebSocket connection attempt")

        await manager.connect(websocket)

        print(f"✅ WebSocket connected | Clients: {len(manager.active_connections)}")

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket)
            print(f"❌ WebSocket disconnected | Clients: {len(manager.active_connections)}")

    # ---------------- REAL-TIME AI STREAM ----------------
    async def stream_data():
        print("🛰️ AI Stream Task is now ACTIVE")

        while True:
            try:
                metrics = generate_metrics()

                if not isinstance(metrics, dict):
                    print("⚠️ Invalid metrics received:", metrics)
                    await asyncio.sleep(2)
                    continue

                cpu = metrics["cpu"]
                memory = metrics["memory"]
                traffic = metrics["traffic"]

                print(f"📊 CPU:{cpu}% | Memory:{memory}% | Traffic:{traffic}")

                is_anomaly = detect_anomaly(metrics)
                print("🧠 AI Prediction:", is_anomaly)

                if is_anomaly:
                    incident = generate_incident(metrics)

                    client_count = len(manager.active_connections)
                    print(f"📡 Connected clients: {client_count}")

                    db_data = {
                        "id": str(incident["id"]),
                        "severity": incident["severity"],
                        "root_cause": incident["root_cause"],
                        "suggestion": incident["suggestion"],
                        "status": incident["status"]
                    }

                    print("📥 Inserting into DB:", db_data)

                    # SAVE TO DB
                    with engine.begin() as conn:
                        conn.execute(
                            text("""
                                INSERT INTO incidents 
                                (id, severity, root_cause, suggestion, status)
                                VALUES 
                                (:id, :severity, :root_cause, :suggestion, :status)
                            """),
                            db_data
                        )

                    print(f"✅ Saved to DB: {db_data['id']}")

                    # SEND TO FRONTEND
                    if client_count > 0:
                        await manager.broadcast({
                            "type": "ALERT",
                            "data": incident
                        })
                    else:
                        print("⚠️ No frontend connected")

            except Exception as e:
                print("❌ ERROR in stream:", e)
                traceback.print_exc()

            await asyncio.sleep(2)

    # ---------------- STARTUP ----------------
    @app.on_event("startup")
    async def startup_event():
        print("🚀 App starting up...")

        # avoid duplicate threads
        if os.environ.get("RUN_MAIN") != "true":
            asyncio.create_task(stream_data())

    return app


# =========================
# 🚀 APP INSTANCE
# =========================
app = create_app()