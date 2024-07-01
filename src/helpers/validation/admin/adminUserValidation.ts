import {body} from 'express-validator';
import { getUserById, getUserByPhone, getUserByEmail } from '../../../models/user';
const config = require('../../../config/index');

export const adminUserStoreValidation = [
    body('firstname').trim().notEmpty().withMessage('لطفا نام کاربر را وارد نمایید'),
    body('lastname').trim().notEmpty().withMessage('لطفا نام خانوادگی کاربر را وارد نمایید'),
    body('emailAddress').trim().notEmpty().withMessage('لطفا ایمیل کاربر را وارد نمایید')
    .isEmail().withMessage('لطفا ایمیل صحیح وارد نمایید')
    .custom(async (value: string) => {
        let user = await getUserByEmail(value);
       
        if(user) {
            throw new Error('کاربر با این ایمیل از قبل در سامانه ثبت شده است. لطفا ایمیل دیگری وارد نمایید.');
        }
    }),
    body('phone').trim().notEmpty().withMessage('لطفا شماره تلفن کاربر را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value: string) => {
        let user = await getUserByPhone(value);
       
        if(user) {
            throw new Error('کاربر با این شماره تلفن از قبل در سامانه ثبت شده است. لطفا شماره تلفن دیگری وارد نمایید.');
        }
    }),
    body('isAdmin').notEmpty().withMessage('لطفا نوع کاربر را تعیین نمایید'),
    body('password')
    .custom(async (value, {req}) => {
        const password = req.body.password;
        const isAdmin = req.body.isAdmin;
       
        if(isAdmin == 1 && password.length == 0) {
            throw new Error('کلمه عبور را وارد نمایید');
        }

        if(isAdmin == 1 && password.length < 8) {
            throw new Error('لطفا حداقل 8 کاراکتر برای کلمه عبور وارد نمایید');
        }
    }),
]

export const adminUserUpdateValidation = [
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
    body('phone').trim().notEmpty().withMessage('لطفا شماره تلفن کاربر را وارد نمایید')
    .matches(config.irPhoneRegEx).withMessage('لطفا شماره تلفن صحیح وارد نمایید')
    .custom(async (value: string, { req }) => {
        let user

        if(req.query._method === 'PUT') {
            user = await getUserById(req.params.id);
           
            if(user.phone === value) {
                return;
            }
        }

        user = await getUserByPhone(value);
       
        if(user) {
            throw new Error('کاربر با این شماره تلفن از قبل در سامانه ثبت شده است. لطفا شماره تلفن دیگری وارد نمایید');
        }
    }),
    body('isAdmin').notEmpty().withMessage('لطفا نوع کاربر را تعیین نمایید'),
    body('password')
    .custom(async (value, {req}) => {
        const password = req.body.password;
        const isAdmin = req.body.isAdmin;
        
        if(password == "password0") {
            return;
        }
       
        if(isAdmin == 1 && (password.length == 0)) {
            throw new Error('کلمه عبور را وارد نمایید');
        }

        if(isAdmin == 1 && password.length < 8) {
            throw new Error('لطفا حداقل 8 کاراکتر برای کلمه عبور وارد نمایید');
        }
    }),
]