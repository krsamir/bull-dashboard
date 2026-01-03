# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first (better caching)
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy rest of the source
COPY . .

# Expose app port (change if needed)
EXPOSE 4000

# Default command
CMD ["yarn", "start"]
