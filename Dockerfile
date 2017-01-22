FROM mhart/alpine-node:6
MAINTAINER denso.ffff@gmail.com

RUN apk add --no-cache make gcc g++ python git openssl openssl-dev
RUN npm install -g yarn gulp

#COPY yarn.lock /srv/yarn.lock
COPY package.json /srv/package.json
RUN cd /srv/ && yarn && cd . rm -fr ~/.cache
COPY . /srv/www/

WORKDIR /srv/www
RUN gulp
RUN gulp babel-client

EXPOSE 5003
CMD cd /srv/www/ && rm -fr node_modules ./app/client/client.js* && gulp watch
