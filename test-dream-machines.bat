@echo off
echo ======================================
echo Dream Machines Parser - TEST MODE
echo ======================================
echo.
echo Note: Edit dreamMachinesParser.ts and set TEST_MODE = true
echo This will parse ONLY 1 motorcycle for testing
echo.
echo Press Ctrl+C to cancel, or
pause

cd /d "%~dp0"
npx ts-node scripts/parsers/dreamMachinesParser.ts

echo.
echo ======================================
echo Test completed!
echo ======================================
pause
