import {body} from 'express-validator';
import { getUserById, getUserByPhone, getUserByEmail } from '../../../models/user';
import {verifyCode} from '../../../models/activeCode';
import mongoose from 'mongoose';
const config = require('../../../config/index');

export const registerAttemptValidation = [
    body('firstname').trim().notEmpty().withMessage('لطفا نام کاربر را وارد نمایید'),
    body('lastname').trim().notEmpty().withMessage('لطفا نام خانوادگی کاربر را وارد نمایید'),
    body('phone').trim().notEmpty().withMessage('لطفا شماره تلفن کاربر را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value: string) => {
        let user = await getUserByPhone(value);
       
        if((user && user.phoneVerified) || (user && user.isAdmin)) {
            throw new Error('کاربر با این شماره تلفن از قبل در سامانه ثبت شده است. لطفا شماره تلفن دیگری وارد نمایید');
        }
    }),
]

export const registerSmsCodeValidation = [
    body('phone').trim().notEmpty().withMessage('لطفا شماره تلفن کاربر را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value: string) => {
        let user = await getUserByPhone(value);
       
        if((user && user.phoneVerified) || (user && user.isAdmin)) {
            throw new Error('کاربر با این شماره تلفن از قبل در سامانه ثبت شده است. لطفا شماره تلفن دیگری وارد نمایید');
        }
    }),
    body('code').trim().notEmpty().withMessage('لطفا کد پیامک شده را وارد نمایید')
    .custom(async (value: string, {req}) => {
        const phone = req.body.phone;
        let code = req.body.code;

        // then check if user exists with that id
        const user = await getUserByPhone(phone);
        if(!user) {
            throw new Error('چنین کاربری وجود ندارد!');
        }
        
        // finally check if SMS code is valid or not
        let verified = await verifyCode(code, user.id);
        if(!verified) {
            throw new Error('لطفا کد پیامک شده را به درستی وارد نمایید');
        }

        // check if user has already verified, then quit
        if(user.phoneVerified) {
            throw new Error('عضویت قبلا با موفقیت انجام شده است');     
        }
    }),
]