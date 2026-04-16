FROM node:20-slim

# Install yt-dlp + python3 (yt-dlp dependency) + ffmpeg (optional but useful)
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
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm install -g typescript && tsc

EXPOSE 3000

CMD ["node", "dist/index.js"]
