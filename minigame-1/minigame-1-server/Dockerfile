FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Compilar TypeScript (si es necesario)
RUN npm run build || echo "No build script found"

# Exponer el puerto
EXPOSE 1234

# Comando para iniciar
CMD ["node", "dist/index.js"]