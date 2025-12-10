FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy source code
COPY apps/web ./apps/web
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build argument for API URL
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build argument for WebSocket URL
ARG VITE_WS_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL

# Build
RUN pnpm build --filter=web...

# Install serve to run static files
RUN npm install -g serve

# Start
CMD ["sh", "-c", "serve -s apps/web/dist -l ${PORT:-8080}"]
