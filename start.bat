@echo off
title maaaaad - Minimalistisk Tilbuds- & Madplan App
echo ===============================================================
echo   maaaaad - Minimalistisk Tilbuds- ^& Madplan App
echo ===============================================================
echo.
echo 🚀 Starter den lokale udviklingsserver...
echo.
echo 💡 Siden aabnes automatisk i din standardbrowser om et ojeblik.
echo 🛑 For at lukke serveren: Tryk [Ctrl + C] i dette terminalvindue.
echo.
echo ===============================================================
echo.

:: Starts default browser at local URL
start http://localhost:5173

:: Runs the Vite development server
npm run dev

pause
