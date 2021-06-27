# NEED TO ADD USER TO SUDO!!!!!!!!!!!!!

# FROM ubuntu:20.04

# WORKDIR /cameraForLIFF

# RUN apt-get install nodejs

# RUN apt-get install npm

# RUN apt-get install ffmpeg

# COPY package*.json ./

# RUN npm install

# COPY . .

# ENV port=8080

# EXPOSE 8080

# CMD [ "npm", "start" ]