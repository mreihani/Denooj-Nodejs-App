import express from 'express';
import { UserModel, deleteUserById, getUsers, getUserById, createUser, paginatedUser, getUserByPhone } from '../../../../models/user';
import {validationResult} from 'express-validator';
import {authentication, random} from '../../../../helpers/index';
import validator from 'validator';

export const userIndex = async(req: express.Request, res: express.Response) => {

    const paginated = await paginatedUser().paginate({
        page: req.query.page || 1, 
        limit: 5,
        sort: {createdAt: "descending"},
        query: {phoneVerified: true}
    });

    let data = {
        title: 'لیست کاربران',
        url: req.path,
        users: paginated,
        success: req.flash('success'),
        errorSingleMessage: req.flash('errorSingleMessage'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
        user: await getUserById(req.session.userId)
    }
    
    res.render('pages/users', {data});
}

export const userCreate = async(req: express.Request, res: express.Response) => {

    let data: any = {
        title: 'افزودن کاربر',
        url: req.path,
        success: req.flash('success'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
        user: await getUserById(req.session.userId)
    }
  
    res.render('pages/users/create', {data});
}

export const userStore = async(req: express.Request, res: express.Response) => {

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

            return res.redirect('/admin/user/create');
        }

        const { firstname, lastname, emailAddress, password, phone, isAdmin } = req.body;

        const cleanedFirstname = validator.escape(firstname);
        const cleanedLastname = validator.escape(lastname);
        const cleanedEmail = validator.escape(emailAddress);
        const cleanedPhone = validator.escape(phone);

        const isAdminBolean = isAdmin == 1 ? true : false;

        if(isAdminBolean) {
            const salt = random();
            const user: any = await createUser({
                firstname: cleanedFirstname,
                lastname: cleanedLastname,
                fullname: cleanedFirstname + " " +cleanedLastname,
                phone: cleanedPhone,
                emailAddress: cleanedEmail,
                isAdmin: isAdminBolean,
                phoneVerified: true,
                authentication: {
                    salt,
                    password: authentication(salt, password),
                }
            });
        } else {
            const user: any = await createUser({
                firstname: cleanedFirstname,
                lastname: cleanedLastname,
                fullname: cleanedFirstname + " " +cleanedLastname,
                phone: cleanedPhone,
                emailAddress: cleanedEmail,
                isAdmin: isAdminBolean,
                phoneVerified: true,
                authentication: {}
            });
        }
       
        req.flash("success", "کاربر مورد نظر با موفقیت ایجاد شد");

        return res.redirect('/admin/user');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const userEdit = async(req: express.Request, res: express.Response) => {
    try {

        let user :Record<string, any> = await UserModel.findById(req.params.id);
        let users = await getUsers();
       
        if(!user) {
            req.flash("errorSingleMessage", "چنین کاربری یافت نشد!");

            return res.redirect('/admin/user');
        }

        let data = {
            title: 'ویرایش کاربر',
            url: req.path,
            users: users,
            success: req.flash('success'),
            errors: req.flash('errors'),
            formData: req.flash('formData')[0],
            user: user
        }
     
        res.render('pages/users/edit', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const userUpdate = async(req: express.Request, res: express.Response) => {
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
        
        const { firstname, lastname, emailAddress, password, phone, isAdmin } = req.body;

        const cleanedFirstname = validator.escape(firstname);
        const cleanedLastname = validator.escape(lastname);
        const cleanedEmail = validator.escape(emailAddress);
        const cleanedPhone = validator.escape(phone);

        const isAdminBolean = isAdmin == 1 ? true : false;
        
        const filter = { _id: req.params.id };

        let update;

        if(isAdminBolean) {
            if(password !== "password0") {
                const salt = random();
                update = {
                    firstname: cleanedFirstname,
                    lastname: cleanedLastname,
                    fullname: cleanedFirstname + " " +cleanedLastname,
                    phone: cleanedPhone,
                    emailAddress: cleanedEmail,
                    isAdmin: isAdminBolean,
                    authentication: {
                        salt,
                        password: authentication(salt, password),
                    }
                };
            } else {
                update = {
                    firstname: cleanedFirstname,
                    lastname: cleanedLastname,
                    fullname: cleanedFirstname + " " +cleanedLastname,
                    phone: cleanedPhone,
                    emailAddress: cleanedEmail,
                    isAdmin: isAdminBolean,
                };
            }
        } else {
            update = {
                firstname: cleanedFirstname,
                lastname: cleanedLastname,
                fullname: cleanedFirstname + " " +cleanedLastname,
                phone: cleanedPhone,
                emailAddress: cleanedEmail,
                isAdmin: isAdminBolean,
                authentication: {}
            };
        }

        await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        req.flash("success", "کاربر مورد نظر با موفقیت بروزرسانی شد");

        return res.redirect('/admin/user');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const userDestroy = async(req: express.Request, res: express.Response) => {
    let user :Record<string, any> = await UserModel.findById(req.params.id);
       
        if(!user) {
            req.flash("errorSingleMessage", "کاربری یافت نشد!");

            return res.redirect('/admin/user');
        }

        const currentUserId = req.session.userId;
        if(currentUserId == req.params.id) {
            req.flash("errorSingleMessage", "شما نمی توانید کاربر خود را حذف کنید! ابتدا با یک کاربر دیگر ورود انجام دهید، بعد اقدام به حذف آن نمایید.");

            return res.redirect('/admin/user');
        }
        
        await user.deleteOne();
        
        req.flash("success", "کاربر مورد نظر با موفقیت حذف شد");

        return res.redirect('/admin/user');
}

export const userSearch = async(req: express.Request, res: express.Response) => {
    try {
        let query:any = {};
        let search: any = req.query.q;
        let trimmedSearch = search.trim();
      
        if(trimmedSearch) {
            query.firstname = new RegExp(trimmedSearch, 'gi');
            query.lastname = new RegExp(trimmedSearch, 'gi');
            query.emailAddress = new RegExp(trimmedSearch, 'gi');
            query.phone = new RegExp((trimmedSearch).replace(/^0+/, ''), 'gi');
            query.fullname = new RegExp(trimmedSearch, 'gi');
        }
        
        const users: any = await paginatedUser().find({phoneVerified: true}).or([
            { firstname: query.firstname },
            { lastname: query.lastname },
            { fullname: query.fullname },
            { emailAddress: query.emailAddress },
            { phone: query.phone },
        ]);

        let data = {
            title: 'جستجوی کاربران',
            url: req.path,
            users: users,
            search: trimmedSearch,
            user: await getUserById(req.session.userId)
        }
        
        return res.render('pages/users/search', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

// delete this seeder after production
export const seedReza = async(req: express.Request, res: express.Response) => {

    try {
        const firstname = "رضا";
        const lastname = "رضا علی زاده";
        const emailAddress = "strezast@gmail.com";
        const phone = "9309003164";
        const password = "fjDau2wftT9UUOAPg9iNujHW"

        const user = await getUserByPhone(phone);
       
        if(user) {
            req.flash("errorSingleMessage", "کاربر مورد نظر از قبل ایجاد شده است.");

            return res.redirect('/admin/user');
        }
      
        const salt = random();
        await createUser({
            firstname: firstname,
            lastname: lastname,
            fullname: firstname + " " +lastname,
            phone: phone,
            emailAddress: emailAddress,
            isAdmin: true,
            phoneVerified: true,
            authentication: {
                salt,
                password: authentication(salt, password),
            }
        });
       
        req.flash("success", "کاربر مورد نظر با موفقیت ایجاد شد");

        return res.redirect('/admin/user');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}