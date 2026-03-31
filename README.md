# 🚀 AI Incident Detection System
A full-stack web application for real-time system monitoring, anomaly detection, and incident management. Built using modern technologies with secure authentication and user-specific dashboards.
---
## 🔥 Features
* 🔐 Secure User Authentication (JWT-based login & register)
* 📊 Dynamic Dashboard with real-time data
* 🚨 Incident detection with severity levels (Low, Medium, High)
* 👤 User-specific data isolation (each user sees their own incidents)
* 📈 Traffic & analytics visualization
* ⚡ FastAPI backend with MySQL database
* 🌐 Fully deployed (Frontend + Backend)
---
## 🛠️ Tech Stack
### Frontend
* React.js
* Tailwind CSS
* Chart.js
### Backend
* FastAPI
* SQLAlchemy
* JWT Authentication
### Database
* MySQL
### Deployment
* Frontend: Vercel
* Backend: Render
---
## 🌍 Live Demo
* 🔗 Backend API: https://ai-incident-detection.onrender.com
* 🔗 Frontend: https://ai-incident-detection.vercel.app/
---
## ⚙️ Local Setup
### 1. Clone the repository
```bash
git clone https://github.com/Vinuthna0728/ai-incident-detection.git
cd ai-incident-detection
---
### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
---
### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
---
## 🔑 Environment Variables
Create a `.env` file in backend:
```env
DATABASE_URL=your_mysql_connection_string
SECRET_KEY=your_secret_key
```
---
## 📌 Key Highlights
* Built a scalable full-stack system with FastAPI and React
* Implemented JWT authentication with protected routes
* Designed user-specific dashboards using database filtering
* Deployed backend on Render and frontend on Vercel
* Created a modern UI inspired by DevOps monitoring tools
---
## 🚀 Future Improvements

* 🔄 Real-time alerts using WebSockets
* 🔊 Notification system with sound alerts
* 🧠 Advanced AI/ML anomaly detection
* 👑 Role-based access (Admin & User)
* 📊 Advanced analytics & filtering
---
## 👨‍💻 Author
Venkata Vinuthna M
---
## ⭐ Support
If you found this project useful, consider giving it a ⭐ on GitHub!

