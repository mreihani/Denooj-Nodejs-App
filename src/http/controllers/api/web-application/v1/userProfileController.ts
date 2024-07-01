import express from 'express';
import {authentication, random} from '../../../../../helpers/index';
import {validationResult} from 'express-validator';
import validator from 'validator';
import { UserModel, getUserById, deleteNotVerifiedUsers, getUserByPhone } from '../../../../../models/user';
import { generateCode } from '../../../../../models/activeCode';
let SmsNotification = require('../../../../../helpers/notification/sms/index');

export const getUserProfile = async(req: express.Request, res: express.Response) => {
    try {
        return res.send({csrfToken: req.csrfToken()});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const updateUserProfile = async(req: express.Request, res: express.Response) => {
   
    const errors = validationResult(req);

    if(!errors.isEmpty())  {
        const errorsArray = errors.array({ onlyFirstError: true });

        return res.json(errorsArray);
    }
    
    try {
        const {gender, email, phone} = req.body;
        
        if(!gender || !email || !phone) {
            return res.sendStatus(400);
        }

        const cleanedEmail = validator.escape(email);
        const cleanedPhone = validator.escape(phone);

        const currentLoggedInUserId = req.session.userId;

        const filter = { _id: req.session.userId };
        let update = {
            gender: gender == 'male' ? 'male' : 'female',
            emailAddress: cleanedEmail,
        };

        await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        // generate and send sms verification code to the user
        const currentLoggedInUser = await UserModel.findById(currentLoggedInUserId);
        if(currentLoggedInUser.phone !== cleanedPhone) {
            let code = await generateCode(currentLoggedInUserId);
            let smsNotification = new SmsNotification(phone);
            smsNotification.smsLoginOpt(code);   

            return res.json({
                status: 'pending',
                msg: 'پیامک با موفقیت ارسال گردید',
                phone: phone
            });
        }

        return res.json({
            status: 'success',
            msg: 'اطلاعات با موفقیت ذخیره شد',
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}


export const userProfileSmsCodeVerify = async(req: express.Request, res: express.Response) => {

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

        const currentLoggedInUser = await UserModel.findById(req.session.userId);
        currentLoggedInUser.phone = phone;
        await currentLoggedInUser.save();

        return res.json({
            status: 'success',
            msg: 'شماره تلفن با موفقیت ذخیره گردید.',
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}
