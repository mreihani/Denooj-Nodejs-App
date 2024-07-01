import express from 'express';
import { validationResult } from 'express-validator';
import { CategoryModel, getCategory, createCategory, paginatedCategory } from '../../../../models/category';
import { getUserById } from '../../../../models/user';
import validator from 'validator';

export const categoryIndex = async(req: express.Request, res: express.Response) => {

    const paginated = await paginatedCategory().paginate({
        page: req.query.page || 1, 
        limit: 5,
        sort: {createdAt: "descending"},
        populate: 'categoryParent'
    });
    
    let data = {
        title: 'لیست دسته بندی ها',
        url: req.path,
        category: paginated,
        success: req.flash('success'),
        errorSingleMessage: req.flash('errorSingleMessage'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
        user: await getUserById(req.session.userId)
    }
   
    res.render('pages/categories', {data});
}

export const categoryCreate = async(req: express.Request, res: express.Response) => {

    let categories = await getCategory();

    let data = {
        title: 'افزودن دسته بندی',
        url: req.path,
        categories: categories,
        success: req.flash('success'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
        user: await getUserById(req.session.userId)
    }

    res.render('pages/categories/create', {data});
}

export const categoryStore = async(req: express.Request, res: express.Response) => {
   
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

            return res.redirect('/admin/category/create');
        }

        const { category_title, category_parent } = req.body;
    
        const cleanedCategoryTitle = validator.escape(category_title);
        const cleanedCategoryParent = validator.escape(category_parent);
    
        const category: any = await createCategory({
            categoryTitle: cleanedCategoryTitle,
            categoryParent: cleanedCategoryParent == "0" ? null : cleanedCategoryParent,
        });
        
        req.flash("success", "دسته بندی مورد نظر با موفقیت ایجاد شد");

        return res.redirect('/admin/category');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const categoryEdit = async(req: express.Request, res: express.Response) => {
    try {

        let category :Record<string, any> = await CategoryModel.findById(req.params.id).populate('categoryParent');
        let categories = await getCategory();
       
        if(!category) {
            req.flash("errorSingleMessage", "چنین دسته بندی یافت نشد!");

            return res.redirect('/admin/category');
        }

        let data = {
            title: 'ویرایش دسته بندی',
            url: req.path,
            categories: categories,
            success: req.flash('success'),
            errors: req.flash('errors'),
            formData: req.flash('formData')[0],
            category: category,
            user: await getUserById(req.session.userId)
        }
     
        res.render('pages/categories/edit', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const categoryUpdate = async(req: express.Request, res: express.Response) => {
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

        let category :Record<string, any> = await CategoryModel.findById(req.params.id);
       
        if(!category) {
            req.flash("errorSingleMessage", "چنین دسته بندی یافت نشد!");

            return res.redirect('/admin/category');
        }
        
        const { category_title, category_parent } = req.body;

        const cleanedCategoryTitle = validator.escape(category_title);
        const cleanedCategoryParent = validator.escape(category_parent);
        
        const filter = { _id: req.params.id };
        const update : any = { 
            categoryTitle: cleanedCategoryTitle,
            categoryParent: cleanedCategoryParent == "0" ? null : cleanedCategoryParent,
        };

        await CategoryModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        req.flash("success", "دسته بندی مورد نظر با موفقیت بروزرسانی شد");

        return res.redirect('/admin/category');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const categoryDestroy = async(req: express.Request, res: express.Response) => {
   
    try {
        let category :Record<string, any> = await CategoryModel.findById(req.params.id).populate('children').exec();
       
        if(!category) {
            req.flash("errorSingleMessage", "چنین دسته بندی یافت نشد!");

            return res.redirect('/admin/category');
        }
        
        // await category.children.forEach((categoryItem: any) => categoryItem.deleteOne());

        await category.deleteOne();
        
        req.flash("success", "دسته بندی مورد نظر با موفقیت حذف شد");

        return res.redirect('/admin/category');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const categorySearch = async(req: express.Request, res: express.Response) => {
    try {
        let query:any = {};
        let search: any = req.query.q;
        let trimmedSearch = search.trim();

        if(trimmedSearch) {
            query.categoryTitle = new RegExp(trimmedSearch, 'gi');
        }

        const category: any = await paginatedCategory().find({...query});

        let data = {
            title: 'جستجو دسته بندی ها',
            url: req.path,
            category: category,
            search: trimmedSearch,
            user: await getUserById(req.session.userId)
        }
        
        return res.render('pages/categories/search', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}
