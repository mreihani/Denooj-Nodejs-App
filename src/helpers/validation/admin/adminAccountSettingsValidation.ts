import {body} from 'express-validator';
import { getUserById, getUserByPhone, getUserByEmail } from '../../../models/user';
import {authentication, random} from '../../../helpers/index';
const config = require('../../../config/index');

export const adminAccountSettingsUserProfileUpdateValidation = [
    body('firstname').trim().notEmpty().withMessage('لطفا نام کاربر را وارد نمایید'),
    body('lastname').trim().notEmpty().withMessage('لطفا نام خانوادگی کاربر را وارد نمایید'),
    body('emailAddress').trim().notEmpty().withMessage('لطفا ایمیل کاربر را وارد نمایید')
    .isEmail().withMessage('لطفا ایمیل صحیح وارد نمایید')
    .custom(async (value: string, { req }) => {
        let user

        if(req.query._method === 'PUT') {
            user = await getUserById(req.params.id);
           
            if(user.emailAddress === value) {
                return;
            }
        }

        user = await getUserByEmail(value);
       
        if(user) {
            throw new Error('کاربر با این ایمیل از قبل در سامانه ثبت شده است. لطفا ایمیل دیگری وارد نمایید');
        }
    }),
]

export const adminAccountSettingsUserPasswordUpdateValidation = [
    body('currentPassword')
    .custom(async (value, {req}) => {
        const password = req.body.currentPassword;
        
        if(password.length == 0) {
            throw new Error('کلمه عبور فعلی خود را وارد نمایید');
        }

        const userId = req.session.userId;
        const user = await getUserById(userId).select('+authentication.salt +authentication.password');
  
        const expectedHash = authentication(user.authentication.salt, password);

        if(user.authentication.password !== expectedHash) {
            throw new Error('کلمه عبور فعلی وارد شده صحیح نیست');
        }
    }),
    body('newPassword')
    .custom(async (value, {req}) => {
        const newPassword = req.body.newPassword;
        
        if(newPassword.length == 0) {
            throw new Error('کلمه عبور جدید خود را وارد نمایید');
        }

        if(newPassword.length < 8) {
            throw new Error('لطفا حداقل 8 کاراکتر برای کلمه عبور جدید خود وارد نمایید');
        }
    }),
    body('confirmPassword')
    .custom(async (value, {req}) => {
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;
        
        if(confirmPassword.length == 0) {
            throw new Error('تکرار کلمه عبور را وارد نمایید');
        }

        if(newPassword !== confirmPassword) {
            throw new Error('کلمه عبور جدید با تأیید آن تطابق ندارد!');
        }
    }),
]

export const adminAccountSettingsUserPhoneUpdateValidation = [
    body('phone')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value, {req}) => {
        const phone = req.body.phone;

        if(!phone) {
            throw new Error('شماره تلفن را وارد نمایید');
        }
        
        const userId = req.session.userId;
        const user = await getUserByPhone(value);

        if(user && user._id.toString() != userId) {
            throw new Error('کاربر با این شماره تلفن از قبل در سامانه ثبت شده است. لطفا شماره تلفن دیگری وارد نمایید');
        }
    }),
]
