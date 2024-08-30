import express from 'express';
import { getUserBySessionToken } from '../../../../../models/user';

// find out if user session cookie is still valid
export const getUserToken = async(req: express.Request, res: express.Response) => {
    try {
        const userSessionCookie = req.cookies.DENOOJ_APP;
        
        if(!userSessionCookie) {
            return res.json({
                status: 'failed',
                user: null
            });
        }

        const existingUser :any = await getUserBySessionToken(userSessionCookie).select("-_id firstname lastname phone emailAddress gender address postalCode");

        if(!existingUser) {
            return res.json({
                status: 'failed',
                user: null
            })
        }

        return res.json({
            status: 'success',
            user: existingUser
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

// logout user through get request
export const logOutApi = async(req: express.Request, res: express.Response) => {
    try {
        const sessionToken = req.cookies['DENOOJ_APP'];
        
        if(sessionToken) {
            res.clearCookie("DENOOJ_APP");
        }

        req.session.destroy((err) => {
            return res.json({
                status: 'success'
            });
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}