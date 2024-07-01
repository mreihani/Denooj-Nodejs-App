import express from 'express';
import csrf from 'csurf';

import { getUserById, getUserBySessionToken } from '../../models/user';

export const isOwner = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { id } = req.params;
        const currentUserId = req.session.userId;

        if(!currentUserId) {
            return res.sendStatus(403);
        }

        if(currentUserId.toString() !== id) {
            return res.sendStatus(403);
        }

        return next();
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const isAdminAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

    try {
        const sessionToken = req.cookies['DENOOJ_APP'];
        
        if(!sessionToken) {
            return res.redirect('/admin/login');
        }

        const existingUser = await getUserBySessionToken(sessionToken);
       
        if(!existingUser) {
            res.clearCookie("DENOOJ_APP");
            return res.redirect('/admin/login');
        }

        if(!existingUser.isAdmin) {
            return res.status(403).send('Restricted for ordinary users! Only admins are allowed.');
        }

        req.session.userId = existingUser.id;
        
        return next();
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const redirectFromLogin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const sessionToken = req.cookies['DENOOJ_APP'];
        
        if(sessionToken) {
            const existingUser = await getUserBySessionToken(sessionToken);

            if(existingUser) {
                req.session.userId = existingUser.id;

                return res.redirect('/admin/dashboard');
            }
        }

        return next();
        
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const csrfProtection = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        csrf({cookie:true});

        return next();
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const isUserAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

    try {
        const sessionToken = req.cookies['DENOOJ_APP'];
        
        if(!sessionToken) {
            return res.sendStatus(403);
        }

        const existingUser = await getUserBySessionToken(sessionToken);
       
        if(!existingUser) {
            res.clearCookie("DENOOJ_APP");
            return res.sendStatus(403);
        }

        req.session.userId = existingUser.id;
        
        return next();
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

