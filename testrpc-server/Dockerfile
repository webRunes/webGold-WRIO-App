FROM node:argon
MAINTAINER denso.ffff@gmail.com
RUN npm config set unsafe-perm=true
RUN npm install -g ethereumjs-testrpc



EXPOSE 8545
CMD ethereumjs-testrpc -b 5 --secure -g 60000