import express from 'express';
import { getUserById } from '../../../../models/user';

export const profileIndex = async(req: express.Request, res: express.Response) => {

    let data = {
        title: 'پروفایل من',
        url: req.path,
        user: await getUserById(req.session.userId)
    }

    res.render('pages/profile', {data});
}

