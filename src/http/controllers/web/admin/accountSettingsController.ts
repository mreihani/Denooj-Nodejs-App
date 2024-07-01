import express from 'express';
import {validationResult} from 'express-validator';
import { UserModel, getUserById } from '../../../../models/user';
import validator from 'validator';
import {authentication, random} from '../../../../helpers/index';
import crypto from 'crypto';
import sharp from 'sharp';
import fs from 'fs';
import mimeType from 'mime-types';
let SmsNotification = require('../../../../helpers/notification/sms/index');

export const accountSettingsIndex = async(req: express.Request, res: express.Response) => {

    let data = {
        title: 'تنظیمات حساب کاربری',
        url: req.path,
        success: req.flash('success'),
        errorSingleMessage: req.flash('errorSingleMessage'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
        user: await getUserById(req.session.userId)
    }

    res.render('pages/account-settings', {data});
}

export const accountSettingsUserProfileUpdate = async (req: express.Request, res: express.Response) => {
   
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty())  {
        
            const errorsArray = errors.array({ onlyFirstError: true });
            
            let messages :any[] = [];
            errorsArray.forEach(msg => {
                messages.push(msg.msg);
            });

            req.flash("errors", messages);
            req.flash("formData", req.body);

            return res.redirect('back');
        }

        let user :Record<string, any> = await UserModel.findById(req.params.id);
       
        if(!user) {
            req.flash("errorSingleMessage", "چنین کاربری یافت نشد!");

            return res.redirect('/admin/user');
        }
        
        const { firstname, lastname, emailAddress, phone, avatar } = req.body;

        const cleanedFirstname = validator.escape(firstname);
        const cleanedLastname = validator.escape(lastname);
        const cleanedEmail = validator.escape(emailAddress);
        
        // upload avatar
        if (req.files && Object.keys(req.files).length > 0) {
            
            let avatar = req.files.avatar as any;

            var cryptoId = crypto.randomBytes(2).toString('hex');
            
            // convert to 200X200
            let avatar_200x200 = Date.now() + cryptoId + '_200x200.' + mimeType.extension(avatar.mimetype);
            let uploadPath200x200 = './public/profile/user-avatars/' + avatar_200x200;
            sharp(avatar.data)
            .resize(200, 200)
            .toFile(uploadPath200x200, (err, info) => {});

            await UserModel.findOneAndUpdate({ _id: req.params.id }, {
                avatar: avatar_200x200
            }, {
                returnOriginal: false
            });

            // delete previous avatar
            if(user.avatar !== null) {
                fs.unlinkSync('./public/profile/user-avatars/' + user.avatar);
            }
        } 
        
        const filter = { _id: req.params.id };
        let update = {
            firstname: cleanedFirstname,
            lastname: cleanedLastname,
            emailAddress: cleanedEmail,
        };

        await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        req.flash("success", "اطلاعات شما با موفقیت بروزرسانی شد");

        return res.redirect('/admin/account-settings');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const accountSettingsUserPasswordUpdate = async (req: express.Request, res: express.Response) => {
   
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty())  {
        
            const errorsArray = errors.array({ onlyFirstError: true });
            
            let messages :any[] = [];
            errorsArray.forEach(msg => {
                messages.push(msg.msg);
            });

            req.flash("errors", messages);
            req.flash("formData", req.body);

            return res.redirect('back');
        }

        let user :Record<string, any> = await UserModel.findById(req.params.id);
       
        if(!user) {
            req.flash("errorSingleMessage", "چنین کاربری یافت نشد!");

            return res.redirect('/admin/account-settings');
        }
        
        const { newPassword } = req.body;

        const salt = random();
        const sessionToken = authentication(salt, user._id.toString())
    
        const filter = { _id: req.params.id };
        let update = {
            authentication: {
                salt,
                password: authentication(salt, newPassword),
                sessionToken: sessionToken
            }
        };

        res.cookie('DENOOJ_APP', sessionToken, 
        {
            domain: 'localhost', 
            path: '/', 
            secure: true,
            httpOnly: true,
            maxAge: 5*24*3600*1000
        });

        await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        req.flash("success", "اطلاعات شما با موفقیت بروزرسانی شد");

        return res.redirect('/admin/account-settings');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const accountSettingsUserPhoneUpdate = async (req: express.Request, res: express.Response) => {
   
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty())  {
        
            const errorsArray = errors.array({ onlyFirstError: true });
            
            let messages :any[] = [];
            errorsArray.forEach(msg => {
                messages.push(msg.msg);
            });

            req.flash("errors", messages);
            req.flash("formData", req.body);

            return res.redirect('back');
        }

        let user :Record<string, any> = await UserModel.findById(req.params.id);
       
        if(!user) {
            req.flash("errorSingleMessage", "چنین کاربری یافت نشد!");

            return res.redirect('/admin/account-settings');
        }
        
        const { phone, twoFactorAuth } = req.body;
        const cleanedPhone = validator.escape(phone);
     
        const filter = { _id: req.params.id };
        let update = {
            phone: cleanedPhone,
            twoFactorAuth: twoFactorAuth == 'on' ? true : false
        };

        await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        req.flash("success", "اطلاعات شما با موفقیت بروزرسانی شد");

        return res.redirect('/admin/account-settings');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}