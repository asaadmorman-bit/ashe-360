# Use a lightweight, production-hardened Node image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy dependency files first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Set environment defaults (can be overridden by Cloud Run)
ENV PORT=8080

# Document the port the container listens on
EXPOSE 8080

# Launch the Sentinel
CMD ["node", "server.js"]