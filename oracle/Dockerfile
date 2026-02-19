FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy built files
COPY dist ./dist

# Copy IDL (needed at runtime)
RUN mkdir -p ../target/idl
COPY ../target/idl/policy_challenges.json ../target/idl/

# Expose webhook port
EXPOSE 3000

# Run the oracle
CMD ["node", "dist/index.js"]

