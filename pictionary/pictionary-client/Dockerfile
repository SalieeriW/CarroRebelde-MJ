FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Puerto del cliente (2000)
ENV PORT=2000
EXPOSE 2000

# Iniciamos Vite forzando el puerto 2000 y el host
CMD ["npm", "run", "dev", "--", "--host", "--port", "2000"]