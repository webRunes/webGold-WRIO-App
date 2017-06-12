FROM mhart/alpine-node:7
MAINTAINER denso.ffff@gmail.com

RUN apk add --no-cache make gcc g++ python git openssl openssl-dev
RUN npm install -g gulp yarn

#COPY yarn.lock /srv/yarn.lock
COPY package.json /srv/package.json
RUN cd /srv/ && yarn
COPY . /srv/www/

WORKDIR /srv/www
RUN gulp

EXPOSE 5003
CMD cd /srv/www/ && gulp watch
