@echo off
echo 正在啟動 Todo List 應用程式...
echo.

echo 啟動後端伺服器...
start "Todo List Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo 啟動前端應用程式...
start "Todo List Frontend" cmd /k "npm run dev"

echo.
echo 應用程式正在啟動中...
echo 前端: http://localhost:3000
echo 後端: http://localhost:5000
echo.
echo 請等待幾秒鐘讓伺服器完全啟動
pause
