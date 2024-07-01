import express from 'express';
import {authentication, random} from '../../../../../helpers/index';
import {validationResult} from 'express-validator';
import validator from 'validator';
import { UserModel, getUserById, deleteNotVerifiedUsers, getUserByPhone, getUserBySessionToken } from '../../../../../models/user';
import { generateCode } from '../../../../../models/activeCode'
import { stat } from 'fs';
let SmsNotification = require('../../../../../helpers/notification/sms/index');

export const loginIndex = async(req: express.Request, res: express.Response) => {
    try {
        return res.send({csrfToken: req.csrfToken()});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const loginAttempt = async(req: express.Request, res: express.Response) => {
    
    const errors = validationResult(req);

    if(!errors.isEmpty())  {
        const errorsArray = errors.array({ onlyFirstError: true });

        return res.json(errorsArray);
    }
    
    try {
        const {phone} = req.body;
        
        if(!phone) {
            return res.sendStatus(400);
        }

        const cleanedPhone = validator.escape(phone);

        const user = await getUserByPhone(cleanedPhone);
   
        // generate and send sms verification code to the user
        let smsNotification = new SmsNotification(phone);
        let code = await generateCode(user.id);
        smsNotification.smsLoginOpt(code);   

        return res.json({
            status: 'success',
            msg: 'پیامک با موفقیت ارسال گردید',
            phone: phone
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const loginAttemptVerifySmsCode = async(req: express.Request, res: express.Response) => {

    const errors = validationResult(req);

    if(!errors.isEmpty())  {
        const errorsArray = errors.array({ onlyFirstError: true });

        return res.json(errorsArray);
    }
    
    try {
        const {phone, code} = req.body;
        
        if(!phone || !code) {
            return res.sendStatus(400);
        }

        const user = await getUserByPhone(phone).select('+authentication.salt +authentication.password');

        if(!user) {
            return res.sendStatus(400);
        }

        const salt = random();
        user.authentication.sessionToken = authentication(salt, user._id.toString());

        // set session cookie
        let sessionCookie;
        const ENVIRONMENT = process.env.NODE_ENV;
        if(ENVIRONMENT == 'development') {
            sessionCookie = require('../../../../../config/index').sessionCookie.development;
        } else if(ENVIRONMENT == 'production') {
            sessionCookie = require('../../../../../config/index').sessionCookie.production;
        }
        res.cookie('DENOOJ_APP', user.authentication.sessionToken, sessionCookie);

        req.session.userId = user.id;
        req.session.isLoggedIn = true;

        await user.save();

        return res.json({
            status: 'success',
            msg: 'خوش آمدید.',
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

