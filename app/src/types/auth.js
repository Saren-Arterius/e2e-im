import {Request} from 'express';

export interface User {
  username: String,
  hash: Buffer
}

export interface AuthedRequest extends Request {
  user: User
}
