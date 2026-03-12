FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# migrate + seed + server စတယ်
CMD ["sh", "-c", "node dist/migrate.js && node dist/seed.js && node dist/index.js"]