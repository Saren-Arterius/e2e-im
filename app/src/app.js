import express from 'express';
import logger from 'morgan';
import moment from 'moment';
import bodyParser from 'body-parser';
import url from 'url';
import Boom from '@hapi/boom';

import {updateDB, sleep, getRandomInt, getUserFromToken} from './utils/misc';
import {CONFIG, knex, firebase, SECRETS, redis} from './common';
import {User, FirebaseAuth} from './types/auth';

(async () => {
  while (updateDB) {
    try {
      await updateDB();
      break;
    } catch (e) {
      console.error(e);
      await sleep(1000);
    }
  }
})();

const app = express();

app.use(logger('dev'));
app.use(express.static('public'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}));

// CORS
app.use((req, res, next) => {
  if (!req.headers.origin) {
    return next();
  }
  const {hostname} = url.parse(req.headers.origin);
  if (CONFIG.trustedHosts[hostname]) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') return res.send();
  return next();
});

// Anti-CSRF
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  const check = req.headers.origin || req.headers.referer;
  if (!check) return next();
  const {hostname} = url.parse(check);
  if (!CONFIG.trustedHosts[hostname]) return next(Boom.badRequest(`Untrusted hostname ${hostname}`));
  return next();
});

app.use((req, res, next) => {
  if (req.query.http_auth) {
    req.headers.authorization = req.query.http_auth;
  }
  req.userIP = req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress;
  req.deviceID = req.headers['x-gateway-id'] ||
    req.headers['X-GATEWAY-ID'];
  next();
});

app.use(async (req, res, next) => {
  const token = req.query.token || req.headers.authorization;
  if (!token || token.startsWith('Basic ')) {
    return next();
  }
  try {
    req.user = await getUserFromToken(token);
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized(e));
  }
  return next();
});


app.use('/', require('./routes/index'));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.output) {
    return res.status(err.output.statusCode)
      .json(err.output.payload);
  }
  throw err;
});

process.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p);
}).on('uncaughtException', (err) => {
  console.error(err, 'Uncaught Exception thrown');
  // process.exit(1);
});

module.exports = app;
