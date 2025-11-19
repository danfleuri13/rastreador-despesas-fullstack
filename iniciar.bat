@echo off
echo --- INICIANDO SISTEMA FULLSTACK ---

:: 1. Abre o Backend (Python)
:: Entra na pasta backend, ativa o ambiente virtual e roda o app
start cmd /k "cd backend && call venv\Scripts\activate && python app.py"

:: 2. Espera 5 segundos para garantir que o Python subiu
timeout /t 5

:: 3. Abre o Frontend (React)
start cmd /k "cd frontend && npm run dev"

echo Tudo pronto!