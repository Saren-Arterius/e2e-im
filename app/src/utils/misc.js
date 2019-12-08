import crypto from 'crypto';
import Boom from '@hapi/boom';
import {AuthedRequest, User} from '../types/auth';
import {redis} from '../common';

export const requireLogin = (req: AuthedRequest, res, next) => {
  if (!req.user) {
    return next(Boom.unauthorized('Not logged in'));
  }
  return next();
};

export const getSessionToken = () => crypto.randomBytes(48).toString('hex');

export const getUserFromToken = async (token): Promise<User> => {
  const key = `token:${token}`;
  const username = await redis.get(key);
  if (!username) throw new Error('Invalid or expired token');
  return {username};
};

