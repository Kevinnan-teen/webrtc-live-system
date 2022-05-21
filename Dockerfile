FROM node:16.13.2
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npmmirror.com
EXPOSE 3000
