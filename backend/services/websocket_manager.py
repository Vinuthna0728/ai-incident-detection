from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    # ---------------- CONNECT ----------------
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔗 Client connected | Total: {len(self.active_connections)}")

    # ---------------- DISCONNECT ----------------
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"❌ Client disconnected | Total: {len(self.active_connections)}")

    # ---------------- BROADCAST ----------------
    async def broadcast(self, message: dict):
        disconnected_clients = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print("⚠️ Error sending to client:", e)
                disconnected_clients.append(connection)

        # Clean up dead connections
        for conn in disconnected_clients:
            self.disconnect(conn)

# Singleton manager
manager = ConnectionManager()