FROM node:20-alpine

WORKDIR /app

# 1. Instalar dependencias primero (para aprovechar la caché de Docker)
COPY package*.json ./
# Usamos npm install en lugar de ci para desarrollo por si el lockfile varía
RUN npm install

# 2. Copiar el código fuente
COPY . .

# 3. Exponer el puerto del servidor (ajusta si usas otro en tu index.ts)
ENV PORT=1234
EXPOSE 1234

# 4. Comando de inicio para desarrollo (asegúrate de que en package.json tengas "dev")
CMD ["npm", "run", "dev"]