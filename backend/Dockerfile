# Use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    gcc \
    g++ \
    python3 \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY .. .

# Set environment variables
ENV NODE_ENV=production
ENV NODE_GYP_FORCE_PYTHON=python3

# Run build command
RUN bun run start

# Expose the port your app runs on
EXPOSE 8558

# Start the application
CMD ["bun", "start"]