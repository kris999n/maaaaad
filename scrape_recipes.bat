@echo off
title maaaaad - Henter Opskrifter fra Valdemarsro og Arla
echo =================================================================
echo   maaaaad - Opdaterer opskrifter fra Valdemarsro og Arla
echo =================================================================
echo.
echo 🚀 Starter opskrifts-crawler (Schema JSON-LD metadata, microdata)...
echo.
echo 💡 Henter og kompilerer signatur-opskrifter. Vent venligst...
echo.
echo =================================================================
echo.

:: Run the Node.js recipe scraper
node scripts/recipeScraper.cjs

echo.
echo =================================================================
echo ✅ Færdig! Genindlaes din app-browser for at se de nye opskrifter.
echo =================================================================
echo.
pause
