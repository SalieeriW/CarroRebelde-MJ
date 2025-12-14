FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Puerto del servidor Pictionary (2234)
ENV PORT=2234
EXPOSE 2234

# Comando de inicio
CMD ["npm", "run", "dev"]