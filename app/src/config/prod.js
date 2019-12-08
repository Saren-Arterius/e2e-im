import {secretsProd} from './secrets-prod';

const secrets = secretsProd;
export const configProd = {
  redis: {
    port: 6379, // Redis port
    host: secrets.redis_host, // Redis host
    password: secrets.redis_password,
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 1
  },
  trustedHosts: {
    localhost: true,
    'e2e-im-api.wtako.net': true
  },
  tokenExpireInSeconds: 3600
};
