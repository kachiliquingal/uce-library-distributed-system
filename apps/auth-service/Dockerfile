# 1. Use an official Node.js base image (lightweight 'alpine' version for better performance)
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy only the dependency files (to leverage Docker's cache)
COPY package*.json ./

# 4. Install the pure dependencies
RUN npm install

# 5. Copy the rest of the source code of the microservice (respecting the .dockerignore)
COPY . .

# 6. Expose the port through which the service communicates
EXPOSE 3001

# 7. Command to run the application in TypeScript
CMD ["npx", "ts-node", "src/index.ts"]