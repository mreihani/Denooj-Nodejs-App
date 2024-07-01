import express from 'express';
import { getUserById } from '../../../../models/user';

export const homeIndex = async(req: express.Request, res: express.Response) => {

    let data = {
        title: 'پیشخوان مدیریت برنج دنوج',
        url: req.path,
        user: await getUserById(req.session.userId)
    }

    res.render('index', {data});
}


