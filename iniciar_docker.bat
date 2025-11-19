@echo off
echo --- SUBINDO O AMBIENTE DOCKER ---
echo Certifique-se que o Docker Desktop esta aberto!
echo.

:: Sobe os containers e mostra os logs no terminal
docker compose up

:: Se quiser rodar em segundo plano e fechar a janela, use: docker compose up -d
pause