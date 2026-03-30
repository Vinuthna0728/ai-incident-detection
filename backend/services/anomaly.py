import numpy as np
from sklearn.ensemble import IsolationForest
import uuid
import random

# ---------------- MODEL ----------------
model = IsolationForest(contamination=0.2)

training_data = np.array([
    [20, 30, 200],
    [30, 40, 300],
    [40, 50, 400],
    [50, 60, 500],
    [35, 45, 350],
    [45, 55, 450]
])

model.fit(training_data)


# ---------------- METRICS GENERATOR ----------------
def generate_metrics():
    cpu = random.randint(10, 100)
    memory = random.randint(20, 100)
    traffic = random.randint(100, 1000)

    metrics = {
        "cpu": cpu,
        "memory": memory,
        "traffic": traffic
    }

    print(f"📊 Metrics -> CPU:{cpu}% | Memory:{memory}% | Traffic:{traffic}")

    return metrics


# ---------------- ANOMALY DETECTION ----------------
def detect_anomaly(metrics):
    try:
        data = np.array([[metrics["cpu"], metrics["memory"], metrics["traffic"]]])
        result = model.predict(data)

        print("🧠 AI Prediction:", result)

        return result[0] == -1
    except Exception as e:
        print("❌ Error in anomaly detection:", e)
        return False


# ---------------- INCIDENT GENERATION ----------------
def generate_incident(metrics):
    try:
        cpu = metrics["cpu"]
        memory = metrics["memory"]
        traffic = metrics["traffic"]

        # Severity logic
        if cpu > 85 or memory > 90:
            severity = "HIGH"
        elif cpu > 60:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Root cause logic
        if cpu > 85:
            root_cause = f"High CPU spike ({cpu}%)"
            suggestion = "Scale servers or restart services"
        elif memory > 90:
            root_cause = f"Memory overload ({memory}%)"
            suggestion = "Check memory leaks"
        else:
            root_cause = f"Traffic surge ({traffic})"
            suggestion = "Check for DDoS or spikes"

        incident = {
            "id": str(uuid.uuid4()),
            "severity": severity,
            "root_cause": root_cause,
            "suggestion": suggestion,
            "status": "OPEN"
        }

        print("🚨 Generated Incident:", incident)

        return incident

    except Exception as e:
        print("❌ Error generating incident:", e)
        return None