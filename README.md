# 💰 Dashboard de Controle Financeiro (Dockerized)

Aplicação Fullstack para gestão de fluxo de caixa pessoal.
Agora rodando 100% em containers Docker para garantir compatibilidade e facilidade de execução.

## 🚀 Tecnologias

- **Frontend:** React, Vite, Recharts (Docker Node Alpine).
- **Backend:** Python, Flask, SQLAlchemy (Docker Python Slim).
- **Banco de Dados:** SQLite.
- **Infraestrutura:** Docker Compose.

## ⚙️ Funcionalidades

- Dashboard visual com gráficos interativos.
- Drill-down: Clique nos gráficos ou cards para ver detalhes.
- Cadastro de Entradas e Saídas.
- Ambiente isolado e reprodutível.

## 📦 Como rodar o projeto

### Pré-requisitos
- Ter o **Docker Desktop** instalado e rodando.

### Passo a Passo
PASSO 1
abra o arquivo iniciar_docker.bat

SEGUNDA OPÇÃO
1. Clone o repositório.
2. Na raiz do projeto, execute:

```bash
docker compose up --build

