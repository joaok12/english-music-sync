#!/bin/bash
cd "$(dirname "$0")"
# Esta é a porta da versão atual do estúdio. A porta 3333 pode estar ocupada
# pela cópia antiga do projeto e usa uma biblioteca de músicas diferente.
PORT=3334
if curl -s -I "http://localhost:${PORT}" > /dev/null 2>&1; then
  echo "Servidor já está rodando na porta ${PORT}. Abrindo karaokê..."
  open "http://localhost:${PORT}"
else
  echo "Iniciando servidor do Karaokê na porta ${PORT}..."
  python3 -m http.server "${PORT}" --bind 127.0.0.1 &
  sleep 1
  open "http://localhost:${PORT}"
fi
