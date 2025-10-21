@echo off
echo Cleaning Next.js cache and rebuilding...

REM Kill any running Node processes
taskkill /f /im node.exe 2>nul

REM Remove Next.js build cache
if exist .next rmdir /s /q .next

REM Remove Node modules cache  
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Remove temporary files
if exist .swc rmdir /s /q .swc

echo Cache cleared! Starting development server...
npm run dev