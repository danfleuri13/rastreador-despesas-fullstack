# frontend/Dockerfile

# MUDANÇA AQUI: Trocamos 18 por 22
FROM node:22-alpine

# Define a pasta de trabalho
WORKDIR /app

# Copia os arquivos de configuração
COPY package.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta 5173
EXPOSE 5173

# Roda o servidor
CMD ["npm", "run", "dev", "--", "--host"]