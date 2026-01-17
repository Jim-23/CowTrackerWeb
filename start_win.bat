@echo off

start "" "node" "server.mjs"
timeout /t 3 /nobreak >nul
start "" "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" "http://localhost:3001/"