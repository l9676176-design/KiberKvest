@echo off
chcp 65001 >nul
where node >nul 2>nul
if errorlevel 1 (
  echo Для запуска нужен Node.js. Он не найден на этом компьютере.
  echo Установите Node.js один раз и снова откройте этот файл.
  pause
  exit /b 1
)
node "%~dp0server.mjs"
if errorlevel 1 pause
