# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /server

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application code to the working directory
COPY . .

# Expose the port your Express app is listening on
EXPOSE 3000

# Start your application using npm run start
CMD ["npm", "run", "start"]
