# backend/Dockerfile

# Usa uma imagem leve do Python
FROM python:3.9-slim

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de requisitos e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código do backend para dentro do container
COPY . .

# Expõe a porta 5000
EXPOSE 5000

# Comando para rodar o app
CMD ["python", "app.py"]