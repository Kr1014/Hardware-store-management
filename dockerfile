FROM node:20-alpine

# 1️⃣ Instalar dependencias del sistema (ANTES de npm/pnpm)
RUN apk add --no-cache poppler-utils

# 2️⃣ Instalar pnpm
RUN npm install -g pnpm

# 3️⃣ Directorio de trabajo
WORKDIR /usr/src/app

# 4️⃣ Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# 5️⃣ Instalar dependencias Node
RUN pnpm install

# 6️⃣ Copiar código
COPY . .

# 7️⃣ Construir
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]
