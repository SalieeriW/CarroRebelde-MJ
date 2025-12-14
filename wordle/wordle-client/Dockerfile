FROM node:20-alpine

WORKDIR /app

# 1. Instalar dependencias
COPY package*.json ./
RUN npm install

# 2. Copiar el código fuente
COPY . .

# 3. Exponer el puerto de Vite
ENV PORT=1000
EXPOSE 1000

# 4. Iniciar Vite. 
# --host es OBLIGATORIO para que funcione dentro de Docker
CMD ["npm", "run", "dev", "--", "--host"]