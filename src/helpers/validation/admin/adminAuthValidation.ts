import {body} from 'express-validator';
import { getUserByPhone } from '../../../models/user';
import { authentication } from '../../index';
import { verifyCode } from '../../../models/activeCode';
const config = require('../../../config/index');

export const loginAttemptValidation = [
    body('phone').notEmpty().withMessage('لطفا شماره تلفن خود را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید'),
    body('password').notEmpty().withMessage('لطفا کلمه عبور خود را وارد نمایید')
    .custom(async (value, {req}) => {
        const phone = req.body.phone;
        const password = req.body.password;

        const user = await getUserByPhone(phone).select('+authentication.salt +authentication.password');

        if(!user || !user.isAdmin) {
           throw new Error('شماره تلفن مورد نظر در سامانه یافت نشد');
        }

        const expectedHash = authentication(user.authentication.salt, password);

        if(user.authentication.password !== expectedHash) {
            throw new Error('کلمه عبور صحیح را وارد نمایید');
        }
    }),
]

export const loginVerificationValidation = [
    body('phone').trim().notEmpty().withMessage('لطفا شماره تلفن کاربر را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value: string) => {
        let user = await getUserByPhone(value);
       
        if(!user || !user.isAdmin || !user.phoneVerified) {
            throw new Error('کاربری با این شماره تلفن یافت نشد!');
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
    }),
]
