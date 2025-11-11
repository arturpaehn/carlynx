@echo off
echo ======================================
echo Dream Machines Parser - FULL MODE
echo ======================================
echo.
echo This will parse up to 10 pages of motorcycles
echo Press Ctrl+C to cancel, or
pause

cd /d "%~dp0"
npx ts-node scripts/parsers/dreamMachinesParser.ts

echo.
echo ======================================
echo Parsing completed!
echo ======================================
pause
