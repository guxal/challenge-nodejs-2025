FROM node:20-alpine

# Siempre deja un workdir fijo
WORKDIR /app

# Copia solo dependencias para aprovechar cache
COPY ../package.json ../package-lock.json ./
RUN npm ci

# Copia el resto del proyecto
COPY ../ .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
