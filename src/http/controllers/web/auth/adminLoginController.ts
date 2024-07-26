import express from 'express';
import {authentication, random} from '../../../../helpers/index';
import {getUserByPhone} from '../../../../models/user';
import {validationResult} from 'express-validator';
import { generateCode } from '../../../../models/activeCode';
const axios = require('axios');
let SmsNotification = require('../../../../helpers/notification/sms/index');

export const loginIndex = (req: express.Request, res: express.Response) => {

    let data = {
        title: 'ورود به مدیریت سامانه دنوج',
        url: req.path,
        success: req.flash('success'),
        errorSingleMessage: req.flash('errorSingleMessage'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
    }
    
    res.render('auth/login', {layout: false, data});
}

export const loginAttempt = async(req: express.Request, res: express.Response) => {

    const errors = validationResult(req);

    if(!errors.isEmpty())  {
        const errorsArray = errors.array({ onlyFirstError: true });

        return res.send({
            errors: errorsArray
        })
    }

    try {
        const {phone, password} = req.body;
        
        if(!phone || !password) {
            return res.sendStatus(400);
        }

        const user = await getUserByPhone(phone).select('+authentication.salt +authentication.password');
        
        if(!user) {
            return res.sendStatus(400);
        }

        const expectedHash = authentication(user.authentication.salt, password);

        if(user.authentication.password !== expectedHash) {
            return res.sendStatus(403);
        }

        // the user has activated two step auth
        if(user.twoFactorAuth) {
            // send code through SMS
            let smsNotification = new SmsNotification(phone);
            let code = await generateCode(user.id);
            smsNotification.smsLoginOpt(code);   

            return res.send({
                twoFactorAuth: user.twoFactorAuth,
                phone: phone
            });
        }

        const salt = random();
        user.authentication.sessionToken = authentication(salt, user._id.toString());

        let dateToday = new Date();
        user.authentication.sessionTokenCreatedAt = dateToday;

        await user.save();

        // set session cookie
        let sessionCookie;
        const ENVIRONMENT = process.env.NODE_ENV;
        if(ENVIRONMENT == 'development') {
            sessionCookie = require('../../../../config/index').sessionCookie.development;
        } else if(ENVIRONMENT == 'production') {
            sessionCookie = require('../../../../config/index').sessionCookie.production;
        }
        
        // res.cookie('DENOOJ_APP', user.authentication.sessionToken, sessionCookie);
        res.cookie('DENOOJ_APP', user.authentication.sessionToken, {
            domain: 'localhost', 
            path: '/', 
            secure: false,
            httpOnly: false,
            maxAge: 5*24*3600*1000,
        });

        req.session.isLoggedIn = true;

        return res.send({
            status: 'success',
            twoFactorAuth: user.twoFactorAuth
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const loginSmsVerify = async(req: express.Request, res: express.Response) => {

    const errors = validationResult(req);

    if(!errors.isEmpty())  {
        const errorsArray = errors.array({ onlyFirstError: true });

        return res.send({
            errors: errorsArray
        })
    }

    try {
        const {phone} = req.body;
        
        if(!phone) {
            return res.sendStatus(400);
        }

        const user = await getUserByPhone(phone).select('+authentication.salt +authentication.password');
        
        if(!user) {
            return res.sendStatus(400);
        }

        const salt = random();
        user.authentication.sessionToken = authentication(salt, user._id.toString());

        let dateToday = new Date();
        user.authentication.sessionTokenCreatedAt = dateToday;

        await user.save();

        // set session cookie
        let sessionCookie;
        const ENVIRONMENT = process.env.NODE_ENV;
        if(ENVIRONMENT == 'development') {
            sessionCookie = require('../../../../config/index').sessionCookie.development;
        } else if(ENVIRONMENT == 'production') {
            sessionCookie = require('../../../../config/index').sessionCookie.production;
        }
        
        res.cookie('DENOOJ_APP', user.authentication.sessionToken, sessionCookie);

        req.session.isLoggedIn = true;

        return res.send({
            status: 'success',
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

