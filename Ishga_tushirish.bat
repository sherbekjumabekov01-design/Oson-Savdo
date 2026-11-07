@echo off
chcp 65001 > nul
title Oson Savdo - POS va Dokon Boshqaruvi
echo ======================================================================
echo             OSON SAVDO - DOKON VA POS KASSA TIZIMI
echo ======================================================================
echo.
echo 1. Backend API ishga tushirilmoqda (http://localhost:5050)...
start "OsonSavdo Backend API" cmd /k "dotnet run --project src\OsonSavdo.Api --no-build"

echo 2. Web POS Frontend ishga tushirilmoqda (http://localhost:3000)...
start "OsonSavdo Web POS" cmd /k "cd /d ""%~dp0web"" && npm run dev"

echo.
echo Tizim yuklanmoqda... (6 soniya kuting)
timeout /t 6 /nobreak > nul

echo 3. Brauzer ochilmoqda...
start http://localhost:3000

echo.
echo ======================================================================
echo   Tizim muvaffaqiyatli ishga tushdi!
echo   Web POS Kassa manzili: http://localhost:3000
echo   API Swagger manzili:   http://localhost:5050/swagger
echo.
echo   Standart kirish hisoblari:
echo   - SuperAdmin (Platforma Egasi / SaaS Nazorati):
echo       Login: superadmin    Parol: super123
echo   - Dokon Admini (Dokon boshqaruvi):
echo       Login: admin         Parol: admin123
echo   - Kassir (POS kassa savdosi):
echo       Login: kassir        Parol: kassir123
echo ======================================================================
echo.
echo Oynalarni yopish uchun har bir konsol oynasida Ctrl+C bosing.
pause
