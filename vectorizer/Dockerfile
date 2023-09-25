# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /vectorizer

ARG GIT_REPO_URL

# Git clone
RUN git clone ${GIT_REPO_URL}

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application code to the working directory
COPY . .

# Start your application using npm run start
CMD ["npm", "run", "start"]
