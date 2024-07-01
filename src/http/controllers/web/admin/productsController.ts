import express from 'express';
import {validationResult} from 'express-validator';
import validator from 'validator';
import { ProductModel, createProduct, paginatedProducts } from '../../../../models/product';
import { getUserById } from '../../../../models/user';
import { getCategory } from '../../../../models/category';
import mimeType from 'mime-types';
import crypto from 'crypto';
import sharp from 'sharp';
import fs from 'fs';

export const productIndex = async(req: express.Request, res: express.Response) => {

    const paginated = await paginatedProducts().paginate({
        page: req.query.page || 1, 
        limit: 5,
        sort: {createdAt: "descending"}
    });
    
    let data = {
        title: 'لیست محصولات',
        url: req.path,
        products: paginated,
        success: req.flash('success'),
        errorSingleMessage: req.flash('errorSingleMessage'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
        user: await getUserById(req.session.userId)
    }

    res.render('pages/products', {data});
}

export const productCreate = async(req: express.Request, res: express.Response) => {

    let categories = await getCategory();

    let data = {
        title: 'افزودن محصول',
        url: req.path,
        success: req.flash('success'),
        errors: req.flash('errors'),
        formData: req.flash('formData')[0],
        categories: categories,
        user: await getUserById(req.session.userId)
    }

    res.render('pages/products/create', {data});
}

export const productStore = async(req: express.Request, res: express.Response) => {
   
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

            return res.redirect('/admin/product/create');
        }

        const { 
            product_title, 
            product_slug, 
            product_weight, 
            product_price, 
            product_discounted_price, 
            stock_available, 
            full_editor_short_desc, 
            full_editor_long_desc, 
            status, category_id, 
            meta_title, 
            meta_description, 
            meta_keywords,
            recommendedProduct,
            northProduct,
            economyProduct
        } = req.body;

        const cleanedProductTitle = validator.escape(product_title);
        const cleanedProductSlug = validator.escape(product_slug.split(' ').join('-').toLowerCase());
        const cleanedProductWeight = validator.escape(product_weight);
        const cleanedProductPrice = validator.escape(product_price);
        const cleanedProductDiscountedPrice = validator.escape(product_discounted_price);
        const productStockAvailable = stock_available == 'on' ? true : false;
        const productStatus = status == 'published' ? true : false;
        const cleanedCategoryId = category_id == 0 ? null : validator.escape(category_id);
        const cleanedMetaTitle = validator.escape(validator.trim(meta_title));
        const cleanedMetaDescription = validator.escape(validator.trim(meta_description));
        const cleanedMetaKeywords = validator.escape(validator.trim(meta_keywords));
        const cleanedRecommendedProduct = recommendedProduct == 'on' ? true : false;
        const cleanedNorthProduct = northProduct == 'on' ? true : false;
        const cleanedEconomyProduct = economyProduct == 'on' ? true : false;
   
       
        // upload image
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }
        let image = req.files.image as any;

        var cryptoId = crypto.randomBytes(2).toString('hex');
        
        // convert to 500X500
        let image_500x500 = Date.now() + cryptoId + '_500x500.' + mimeType.extension(image.mimetype);
        let uploadPath500x500 = './public/products/images/' + image_500x500;
        sharp(image.data)
        .resize(500, 500)
        .toFile(uploadPath500x500, (err, info) => {});

        // convert to 275X454
        let image_275x454 = Date.now() + cryptoId + '_275x254.' + mimeType.extension(image.mimetype);
        let uploadPath275x454 = './public/products/images/' + image_275x454;
        sharp(image.data)
        .resize(275, 454)
        .toFile(uploadPath275x454, (err, info) => {});

        let randomImageName = {
            image_500x500,
            image_275x454
        }

        const product: any = await createProduct({
            productTitle: cleanedProductTitle,
            productSlug: cleanedProductSlug,
            productWeight: cleanedProductWeight,
            productPrice: cleanedProductPrice,
            productDiscountedPrice: cleanedProductDiscountedPrice,
            stockAvailable: productStockAvailable,
            images: randomImageName,
            productStatus: productStatus,
            shortDesc: full_editor_short_desc,
            longDesc: full_editor_long_desc,
            category: cleanedCategoryId,
            metaTitle: cleanedMetaTitle,
            metaDescription: cleanedMetaDescription,
            metaKeywords: cleanedMetaKeywords,
            recommendedProduct: cleanedRecommendedProduct,
            northProduct: cleanedNorthProduct,
            economyProduct: cleanedEconomyProduct,
        });
        
        req.flash("success", "محصول مورد نظر با موفقیت ایجاد شد");

        return res.redirect('/admin/product');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const productEdit = async(req: express.Request, res: express.Response) => {
    try {
        let product :Record<string, any> = await ProductModel.findById(req.params.id).populate('category').exec();
        let categories = await getCategory();
       
        if(!product) {
            req.flash("errorSingleMessage", "چنین محصولی یافت نشد!");

            return res.redirect('/admin/product');
        }

        let data = {
            title: 'ویرایش محصول',
            url: req.path,
            success: req.flash('success'),
            errors: req.flash('errors'),
            formData: req.flash('formData')[0],
            product: product,
            categories: categories,
            user: await getUserById(req.session.userId)
        }
    
        res.render('pages/products/edit', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const productUpdate = async(req: express.Request, res: express.Response) => {
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

        let product :Record<string, any> = await ProductModel.findById(req.params.id);
       
        if(!product) {
            req.flash("errorSingleMessage", "چنین محصولی یافت نشد!");

            return res.redirect('/admin/product');
        }
        
        const { 
            product_title, 
            product_slug, 
            product_weight, 
            product_price, 
            product_discounted_price, 
            stock_available, 
            full_editor_short_desc, 
            full_editor_long_desc, 
            status, category_id, 
            meta_title, 
            meta_description, 
            meta_keywords,
            recommendedProduct,
            northProduct,
            economyProduct 
        } = req.body;

        const cleanedProductTitle = validator.escape(product_title);
        const cleanedProductSlug = validator.escape(product_slug.split(' ').join('-').toLowerCase());
        const cleanedProductWeight = validator.escape(product_weight);
        const cleanedProductPrice = validator.escape(product_price);
        const cleanedProductDiscountedPrice = validator.escape(product_discounted_price);
        const productStockAvailable = stock_available == 'on' ? true : false;
        const productStatus = status == 'published' ? true : false;
        const cleanedCategoryId = category_id == 0 ? null : validator.escape(category_id);
        const cleanedMetaTitle = validator.escape(validator.trim(meta_title));
        const cleanedMetaDescription = validator.escape(validator.trim(meta_description));
        const cleanedMetaKeywords = validator.escape(validator.trim(meta_keywords));
        const cleanedRecommendedProduct = recommendedProduct == 'on' ? true : false;
        const cleanedNorthProduct = northProduct == 'on' ? true : false;
        const cleanedEconomyProduct = economyProduct == 'on' ? true : false;

        // upload image
        if (req.files && Object.keys(req.files).length > 0) {
            
            let image = req.files.image as any;

            var cryptoId = crypto.randomBytes(2).toString('hex');
            
            // convert to 500X500
            let image_500x500 = Date.now() + cryptoId + '_500x500.' + mimeType.extension(image.mimetype);
            let uploadPath500x500 = './public/products/images/' + image_500x500;
            sharp(image.data)
            .resize(500, 500)
            .toFile(uploadPath500x500, (err, info) => {});

            // convert to 275X454
            let image_275x454 = Date.now() + cryptoId + '_275x254.' + mimeType.extension(image.mimetype);
            let uploadPath275x454 = './public/products/images/' + image_275x454;
            sharp(image.data)
            .resize(275, 454)
            .toFile(uploadPath275x454, (err, info) => {});

            let randomImageName = {
                image_500x500,
                image_275x454
            }

            await ProductModel.findOneAndUpdate({ _id: req.params.id }, {
                images: randomImageName
            }, {
                returnOriginal: false
            });

            // delete previous image files
            Object.values(product.images).forEach(image => {
                fs.unlinkSync('./public/products/images/' + image);
            });
        } 
        
        const filter = { _id: req.params.id };
        const update = { 
            productTitle: cleanedProductTitle,
            productSlug: cleanedProductSlug,
            productWeight: cleanedProductWeight,
            productPrice: cleanedProductPrice,
            productDiscountedPrice: cleanedProductDiscountedPrice,
            stockAvailable: productStockAvailable,
            productStatus: productStatus,
            shortDesc: full_editor_short_desc,
            longDesc: full_editor_long_desc,
            category: cleanedCategoryId,
            metaTitle: cleanedMetaTitle,
            metaDescription: cleanedMetaDescription,
            metaKeywords: cleanedMetaKeywords,
            recommendedProduct: cleanedRecommendedProduct,
            northProduct: cleanedNorthProduct,
            economyProduct: cleanedEconomyProduct,
        };

        await ProductModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        req.flash("success", "محصول مورد نظر با موفقیت بروزرسانی شد");

        return res.redirect('/admin/product');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const productDestroy = async(req: express.Request, res: express.Response) => {
   
    try {
        let product :Record<string, any> = await ProductModel.findById(req.params.id);
       
        if(!product) {
            req.flash("errorSingleMessage", "چنین محصولی یافت نشد!");

            return res.redirect('/admin/product');
        }

        Object.values(product.images).forEach(image => {
            fs.unlinkSync('./public/products/images/' + image);
        });
    
        await product.deleteOne();
        
        req.flash("success", "محصول مورد نظر با موفقیت حذف شد");

        return res.redirect('/admin/product');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const productSearch = async(req: express.Request, res: express.Response) => {
    try {
        let query:any = {};
        let search: any = req.query.q;
        let trimmedSearch = search.trim();

        if(trimmedSearch) {
            query.productTitle = new RegExp(trimmedSearch, 'gi');
        }

        const product: any = await paginatedProducts().find({...query});

        let data = {
            title: 'جستجو محصولات',
            url: req.path,
            products: product,
            search: trimmedSearch,
            user: await getUserById(req.session.userId)
        }
        
        return res.render('pages/products/search', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}



