#!/bin/bash

# Liberar puertos si estuvieran ocupados de una sesión anterior
fuser -k 5162/tcp 2>/dev/null && echo "Puerto 5162 liberado"
fuser -k 5173/tcp 2>/dev/null && echo "Puerto 5173 liberado"
pkill -f "notion-clon-assistant/node_modules/electron" 2>/dev/null && echo "Electron anterior detenido"
sleep 1

echo "Arrancando NotionClon Backend..."
(cd "$(dirname "$0")/NotionClon.API" && ASPNETCORE_ENVIRONMENT=Development dotnet run) &
BACKEND_PID=$!

echo "Arrancando NotionClon Frontend..."
(cd "$(dirname "$0")/notion-clon-client" && npm run dev) &
FRONTEND_PID=$!

echo "Arrancando Asistente IA..."
(cd "$(dirname "$0")/notion-clon-assistant" && \
  unset ELECTRON_RUN_AS_NODE && \
  export ELECTRON_OZONE_PLATFORM_HINT=auto && \
  export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}" && \
  npm start) &
ASSISTANT_PID=$!

echo ""
echo "NotionClon corriendo:"
echo "  Frontend  → http://localhost:5173"
echo "  Backend   → http://localhost:5162"
echo "  Asistente → bandeja del sistema"
echo ""
echo "Presiona Ctrl+C para detener todo."

trap "kill $BACKEND_PID $FRONTEND_PID $ASSISTANT_PID 2>/dev/null; exit" INT TERM
wait
