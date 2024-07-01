import express from 'express';
import adminRouter from './admin';

const router = express.Router();

export default (): express.Router => {
    adminRouter(router);

    return router;
}