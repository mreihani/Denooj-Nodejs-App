import { check } from 'express-validator';
import { getProductsBySlug, getProductById } from '../../../models/product';

export const adminProductStoreValidation = [
    check('product_title').trim().notEmpty().withMessage('لطفا نام محصول را وارد نمایید'),
    check('product_slug').trim().notEmpty().withMessage('لطفا اسلاگ را وارد نمایید')
    .custom(async (value: string) => {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(value)) {
            throw new Error('اسلاگ باید با حروف انگلیسی نوشته شود.');
        }

        let product = await getProductsBySlug(value);
       
        if(product) {
            throw new Error('اسلاگ از قبل در سامانه ثبت شده است. لطفا عبارت دیگری انتخاب نمایید.');
        }
    }),
    check('full_editor_short_desc').trim().notEmpty().withMessage('لطفا جزئیات محصول را وارد نمایید'),
    check('full_editor_long_desc').trim().notEmpty().withMessage('لطفا توضیحات کامل محصول را وارد نمایید'),
    check('product_price').trim().notEmpty().withMessage('لطفا قیمت محصول را وارد نمایید')
    .custom(async (value: string, { req }) => {
        const productPrice = req.body.product_price;
        const productDiscountedPrice = req.body.product_discounted_price;

        if(productPrice <= 0) {
            throw new Error('قیمت محصول نمی تواند صفر یا منفی باشد!');
        }  

        if(productDiscountedPrice < 0) {
            throw new Error('قیمت با تخفیف نمی تواند منفی باشد!');
        } 

        if(productPrice <= productDiscountedPrice) {
            throw new Error('قیمت محصول نمی تواند کوچک تر از یا برابر قیمت با تخفیف باشد!');
        }  
    }),
    check('image')
    .custom(async (value: string, { req }) => {

        if(req.files == null || req.files.image == null) {
            throw new Error('لطفا تصویر محصول را انتخاب نمایید.');
        }

        let fileExt = ['image/jpg', 'image/jpeg', 'image/png', 'image/bmp'];
        if(req.files.image && !fileExt.includes(req.files.image.mimetype)) {
            throw new Error('لطفا تصویر با فرمت صحیح را آپلود نمایید.');
        }

        if(req.files.image && req.files.image.size > 4194304) {
            throw new Error('حجم تصویر بیشتر از 4 مگابایت است. لطفا تصویر دیگری بارگذاری نمایید.');
        }
    }),
    check('category_id').trim().notEmpty().withMessage('لطفا دسته بندی مرتبط با محصول را انتخاب نمایید'),
]

export const adminProductUpdateValidation = [
    check('product_title').trim().notEmpty().withMessage('لطفا نام محصول را وارد نمایید'),
    check('product_slug').trim().notEmpty().withMessage('لطفا اسلاگ را وارد نمایید')
    .custom(async (value: string, { req }) => {

        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(value)) {
            throw new Error('اسلاگ باید با حروف انگلیسی نوشته شود.');
        }

        let product;
        if(req.query._method === 'PUT') {
            product = await getProductById(req.params.id);
           
            if(product.productSlug === value) {
                return;
            }
        }

        product = await getProductsBySlug(value);
       
        if(product) {
            throw new Error('اسلاگ از قبل در سامانه ثبت شده است. لطفا عبارت دیگری انتخاب نمایید');
        }
    }),
    check('full_editor_short_desc').trim().notEmpty().withMessage('لطفا جزئیات محصول را وارد نمایید'),
    check('full_editor_long_desc').trim().notEmpty().withMessage('لطفا توضیحات کامل محصول را وارد نمایید'),
    check('product_price').trim().notEmpty().withMessage('لطفا قیمت محصول را وارد نمایید')
    .custom(async (value: string, { req }) => {
        const productPrice = req.body.product_price;
        const productDiscountedPrice = req.body.product_discounted_price;

        if(productPrice <= 0) {
            throw new Error('قیمت محصول نمی تواند صفر یا منفی باشد!');
        }  

        if(productDiscountedPrice < 0) {
            throw new Error('قیمت با تخفیف نمی تواند منفی باشد!');
        } 

        if(productPrice <= productDiscountedPrice) {
            throw new Error('قیمت محصول نمی تواند کوچک تر از یا برابر قیمت با تخفیف باشد!');
        }  
    }),
    check('image')
    .custom(async (value: string, { req }) => {

        if(req.query._method === 'PUT' && value === undefined) {
            return;
        }

        if(req.files == null || req.files.image == null) {
            throw new Error('لطفا تصویر محصول را انتخاب نمایید');
        }

        let fileExt = ['image/jpg', 'image/jpeg', 'image/png', 'image/bmp'];
        if(req.files.image && !fileExt.includes(req.files.image.mimetype)) {
            throw new Error('لطفا تصویر با فرمت صحیح را آپلود نمایید');
        }

        if(req.files.image && req.files.image.size > 4194304) {
            throw new Error('حجم تصویر بیشتر از 4 مگابایت است. لطفا تصویر دیگری بارگذاری نمایید');
        }
    }),
    check('category_id').trim().notEmpty().withMessage('لطفا دسته بندی مرتبط با محصول را انتخاب نمایید'),
]