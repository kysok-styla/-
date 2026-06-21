@echo off
chcp 65001 >nul
title Запуск АИС "Электронная библиотека"
cd /d "%~dp0"

echo ========================================
echo   Запуск модифицированной АИС
echo   Специальность 09.02.07
echo ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден!
    echo Установите с https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Проверка зависимостей...
if not exist "node_modules" (
    echo Установка пакетов...
    call npm install
) else (
    echo Зависимости установлены.
)

echo [2/3] Запуск сервера...
echo [3/3] Открытие браузера...
start "" http://localhost:3001
echo.
echo Сервер запущен: http://localhost:3000
echo Не закрывайте это окно!
echo ========================================
echo.

node server.js
pause