FROM michbil/wrio:latest
MAINTAINER denso.ffff@gmail.com
#RUN add-apt-repository -y ppa:ethereum/ethereum
#RUN add-apt-repository -y ppa:ethereum/ethereum-dev
#RUN apt-get update && apt-get install -y nodejs mc libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++ git  libkrb5-dev
#RUN apt-get install -y ethereum

COPY package.json /srv/package.json
RUN cd /srv/ && npm install # packages are installed globally to not modify titter directory
COPY . /srv/www/

WORKDIR /srv/www
RUN gulp

EXPOSE 5003
CMD cd /srv/www/ && rm -fr node_modules && gulp watch