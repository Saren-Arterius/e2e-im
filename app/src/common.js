import Redis from 'ioredis';
import {configProd} from './config/prod';
import {configDev} from './config/dev';
import {secretsDev} from './config/secrets-dev';
import {secretsProd} from './config/secrets-prod';

// process.env.PROD = 1;
export const SECRETS = process.env.PROD ? secretsProd : secretsDev;
export const CONFIG = process.env.PROD ? configProd : configDev;

export const redis = new Redis(CONFIG.redis);
