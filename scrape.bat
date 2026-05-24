@echo off
title maaaaad - Henter Ægte Live Tilbud
echo =================================================================
echo   maaaaad - Opdaterer live tilbud fra danske supermarkeder
echo =================================================================
echo.
echo 🚀 Starter live-crawler (Rema 1000 API, Coop, Salling, Tjek.dk)...
echo.
echo 💡 Dette kan tage et par sekunder. Vent venligst...
echo.
echo =================================================================
echo.

:: Run the Node.js scraper
npm run scrape

echo.
echo =================================================================
echo ✅ Færdig! Genindlaes din app-browser for at se de nye live priser.
echo =================================================================
echo.
pause
