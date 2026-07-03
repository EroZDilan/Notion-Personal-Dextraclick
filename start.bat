@echo off
echo Arrancando NotionClon...

start "Backend" cmd /k "cd /d "%~dp0NotionClon.API" && dotnet run"
start "Frontend" cmd /k "cd /d "%~dp0notion-clon-client" && npm run dev"
start "Asistente IA" cmd /k "cd /d "%~dp0notion-clon-assistant" && set ELECTRON_RUN_AS_NODE= && npm run start:win"

echo.
echo NotionClon corriendo:
echo   Frontend  -^> http://localhost:5173
echo   Backend   -^> http://localhost:5162
echo   Asistente -^> bandeja del sistema
echo.
echo Cierra las ventanas individuales para detener cada servicio.
