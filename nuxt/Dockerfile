FROM node:12-alpine

RUN npm config set unsafe-perm true

ENV APP_ROOT /src

RUN mkdir ${APP_ROOT}
WORKDIR ${APP_ROOT}
ADD . ${APP_ROOT}

RUN npm install
RUN npm run build
ENV HOST 0.0.0.0

CMD npm start