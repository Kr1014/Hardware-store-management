FROM node:20-alpine

# 1. Instalar pnpm
RUN npm install -g pnpm

# 2. Definir directorio de trabajo
WORKDIR /usr/src/app

# 3. Copiar los archivos que definen las librerías
# AHORA Docker sí podrá ver el pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 4. Instalar dependencias
RUN pnpm install

# 5. Copiar el resto del código
COPY . .

# 6. Construir
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]