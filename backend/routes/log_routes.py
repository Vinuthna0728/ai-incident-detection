from fastapi import APIRouter
from sqlalchemy import text
import database.db as db

from services.anomaly import detect_anomaly
from services.llm import analyze_log

router = APIRouter()

@router.post("/log")
def create_log(log: dict):
    try:
        engine = db.engine

        with engine.connect() as conn:

            # ✅ 1. Insert log
            result = conn.execute(text("""
                INSERT INTO logs (message, cpu, memory, timestamp)
                VALUES (:message, :cpu, :memory, :timestamp)
            """), {
                "message": log["message"],
                "cpu": log["cpu"],
                "memory": log["memory"],
                "timestamp": log["timestamp"]
            })

            conn.commit()

            # SQLAlchemy way to get inserted ID
            log_id = result.lastrowid
            print(f"✅ Log inserted with ID: {log_id}")

            # ✅ 2. Detect anomaly
            is_anomaly = detect_anomaly([log["cpu"], log["memory"], 0])
            print(f"🔍 Anomaly Detection Result: {is_anomaly}")

            # ✅ 3. If anomaly → create incident
            if is_anomaly:
                try:
                    llm_output = analyze_log(log["message"])
                    print("🤖 LLM OUTPUT:", llm_output)
                except Exception as e:
                    print("❌ LLM ERROR:", e)
                    llm_output = {
                        "root_cause": "Unknown issue",
                        "severity": "MEDIUM",
                        "suggestion": "Check logs manually"
                    }

                conn.execute(text("""
                    INSERT INTO incidents (log_id, root_cause, severity, suggestion, status)
                    VALUES (:log_id, :root_cause, :severity, :suggestion, :status)
                """), {
                    "log_id": log_id,
                    "root_cause": llm_output.get("root_cause"),
                    "severity": llm_output.get("severity"),
                    "suggestion": llm_output.get("suggestion"),
                    "status": "OPEN"
                })

                conn.commit()

                print("🚨 Incident created successfully")

            else:
                print("✅ No anomaly detected")

        return {
            "status": "Log processed",
            "log_id": log_id,
            "anomaly": bool(is_anomaly)
        }

    except Exception as e:
        print("❌ ERROR:", e)
        return {"error": str(e)}