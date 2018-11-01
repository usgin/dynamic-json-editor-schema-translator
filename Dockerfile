FROM node:8.10-alpine

WORKDIR /mdeditor

COPY package.json /mdeditor

RUN npm install 

# Bundle app source
COPY . /mdeditor

EXPOSE 80

CMD [ "npm", "start" ]