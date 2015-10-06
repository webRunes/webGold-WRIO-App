FROM ubuntu:15.04
MAINTAINER denso.ffff@gmail.com
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash -
RUN apt-get update && apt-get install -y nodejs mc libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++ git  libkrb5-dev


RUN npm install -g http-server browserify gulp nodemon
RUN mkdir -p /srv/www

COPY package.json /srv/package.json
RUN cd /srv/ && npm install # packages are installed globally to not modify titter directory
COPY . /srv/www/

RUN npm install -g babel

EXPOSE 5003
CMD cd /srv/www/ && rm -fr node_modules && gulp watch