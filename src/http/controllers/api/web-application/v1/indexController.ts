import express from 'express';

export const index = (req: express.Request, res: express.Response) => {
    res.json('Home Page');
}

