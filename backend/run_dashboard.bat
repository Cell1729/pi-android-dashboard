@echo off

:: --- gnirehtet の起動 ---
:: gnirehtet.exe があるフォルダへ移動（例: C:\gnirehtet-rust-win64）
cd /d "C:\Users\sabax\gnirehtet-rust-win64\platform-tools"
start /b gnirehtet run

:: --- FastAPI の起動 ---
cd /d "C:\Users\sabax\source\repos\pi-android-dashboard\backend"
call ..\.venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000