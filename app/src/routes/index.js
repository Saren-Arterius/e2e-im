import express from 'express';
import Boom from '@hapi/boom';
import {AuthedRequest} from '../types/auth';
import {getSessionToken} from '../utils/misc';
import {redis, CONFIG} from '../common';
import {hashPassword, verifyPassword} from '../utils/pbkdf2';

const router = express.Router();

[].forEach((p) => {
  router.use(`/${p}`, require(`./${p}`));
});

router.post('/login', async (req: AuthedRequest, res, next) => {
  if (req.user) return next(Boom.badRequest('Already logged in'));
  const {username, password} = req.body;
  if (!username || !password) return next(Boom.badRequest('Missing body'));
  const key = `username:${username}`;
  const storedHash = await redis.getBuffer(key);
  if (!storedHash) {
    const newHash = await hashPassword(password);
    await redis.setBuffer(key, newHash);
  } else {
    try {
      await verifyPassword(password, storedHash);
    } catch (e) {
      console.error(e);
      return next(Boom.unauthorized('Incorrect password'));
    }
  }

  // Destroy existing active token
  const atkKey = `active-token-key:${username}`;
  const atk = await redis.get(atkKey);
  await redis.del(atk);

  // Generate and save token
  const token = getSessionToken();
  const tokenKey = `token:${token}`;
  await redis.setex(tokenKey, CONFIG.tokenExpireInSeconds, username);

  // Mark this as active token
  await redis.set(atkKey, tokenKey);

  return res.send({
    username,
    token
  });
});
module.exports = router;
