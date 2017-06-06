FROM mhart/alpine-node:7
MAINTAINER denso.ffff@gmail.com

RUN apk add --no-cache make gcc g++ python git openssl openssl-dev
RUN npm install -g gulp yarn

#COPY yarn.lock /srv/yarn.lock
COPY package.json /srv/package.json
RUN cd /srv/ && yarn
COPY . /srv/www/

RUN cd /srv && ./node_modules/.bin/babel ./node_modules/ethereumjs-tx --source-root ./node_modules/ethereumjs-tx  -d ./node_modules/ethereumjs-tx --presets=es2015 #https://github.com/ethereumjs/ethereumjs-tx/issues/59

WORKDIR /srv/www
RUN gulp
RUN gulp babel-client

EXPOSE 5003
CMD cd /srv/www/ && rm -fr node_modules ./app/client/client.js* && gulp watch
