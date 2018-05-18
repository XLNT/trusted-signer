FROM node:9.11.1

WORKDIR /usr/src/app
COPY . .
RUN yarn install

EXPOSE 3002
CMD ["node", "lib/index.js"]
