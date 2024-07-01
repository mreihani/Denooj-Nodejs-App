import { verifyCode } from "../../../models/activeCode";
import { getUserByEmail, getUserById, getUserByPhone } from "../../../models/user";
import {body} from 'express-validator';
const config = require('../../../config/index');


export const userProfileValidation = [
    body('gender').trim().notEmpty().withMessage('لطفا جنسیت را تعیین نمایید'),
    body('email').trim().notEmpty().withMessage('لطفا ایمیل کاربر را وارد نمایید')
    .isEmail().withMessage('لطفا ایمیل صحیح وارد نمایید')
    .custom(async (value: string, { req }) => {
         
        let user = await getUserById(req.session.userId);
        if(user.emailAddress === value) {
            return;
        }

        user = await getUserByEmail(value);
       
        if(user) {
            throw new Error('کاربر با این ایمیل از قبل در سامانه ثبت شده است. لطفا ایمیل دیگری وارد نمایید');
        }
    }),
    body('phone').trim().notEmpty().withMessage('لطفا شماره تلفن کاربر را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value: string, { req }) => {
        const phone = req.body.phone;
        let user = await getUserByPhone(phone);
       
        // ignore user's self phone number from validation
        const currentLoggedInUserId = req.session.userId;
        
        const currentLoggedInUser = await getUserById(currentLoggedInUserId);
        if(currentLoggedInUser.phone == phone) {
            return;
        }
        
        if((user && user.phoneVerified) || (user && user.isAdmin)) {
            throw new Error('کاربر با این شماره تلفن از قبل در سامانه ثبت شده است. لطفا شماره تلفن دیگری وارد نمایید');
        }
    }),
]

export const userProfileSmsCodeValidation = [
    body('phone').trim().notEmpty().withMessage('لطفا شماره تلفن کاربر را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value: string, { req }) => {
        const phone = req.body.phone;
        let user = await getUserByPhone(phone);
       
        // ignore user's self phone number from validation
        const currentLoggedInUserId = req.session.userId;
        const currentLoggedInUser = await getUserById(currentLoggedInUserId);
        if(currentLoggedInUser.phone == phone) {
            return;
        }
        
        if((user && user.phoneVerified) || (user && user.isAdmin)) {
            throw new Error('کاربر با این شماره تلفن از قبل در سامانه ثبت شده است. لطفا شماره تلفن دیگری وارد نمایید');
        }
    }),
    body('code').trim().notEmpty().withMessage('لطفا کد پیامک شده را وارد نمایید')
    .custom(async (value: string, {req}) => {
        const phone = req.body.phone;
        let code = req.body.code;
       
        const currentLoggedInUserId = req.session.userId;

        // finally check if SMS code is valid or not
        let verified = await verifyCode(code, currentLoggedInUserId);
        if(!verified) {
            throw new Error('لطفا کد پیامک شده را به درستی وارد نمایید');
        }
    }),
]
