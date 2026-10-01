FROM node:22-slim

WORKDIR /app

# Install openssl required for Prisma engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# Copy root package.json and workspace package.jsons
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install dependencies (ignoring scripts during install to avoid premature prisma generation if schema isn't copied yet)
RUN npm ci --ignore-scripts

# Copy source code
COPY shared/ shared/
COPY backend/ backend/

# Build shared first
RUN npm run build --workspace=shared

# Build backend and generate prisma client
RUN npm run build --workspace=backend

EXPOSE 8080

CMD ["npm", "run", "start", "--workspace=backend"]
