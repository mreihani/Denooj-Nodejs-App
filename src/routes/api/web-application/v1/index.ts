import express from 'express';
import publicRouter from './public';

const router = express.Router();

export default (): express.Router => {
    publicRouter(router);

    return router;
}