FROM node:20-slim

# Install yt-dlp dependencies + ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./

# Install ALL deps including devDeps (TypeScript + @types/node needed to build)
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Build TypeScript using local tsc (from devDeps)
RUN npx tsc

# Prune devDeps — production image only needs dist/ + node_modules prod deps
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
