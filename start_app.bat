@echo off
start "Backend" cmd /k "cd backend && python main.py"
start "Frontend" cmd /k "cd frontend && npm run dev"
echo App started! Access frontend at http://localhost:5173
