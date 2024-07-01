import crypto from 'crypto';
require('dotenv').config();
import express from 'express';
import { getUserBySessionToken } from '../models/user';

const SECRET = process.env.DB_SECRETKEY;

export const random = () => crypto.randomBytes(128).toString('base64');

export const authentication = (salt: string, password: string) => {
    return crypto.createHmac('sha256', [salt, password].join('/')).update(SECRET).digest('hex');
}