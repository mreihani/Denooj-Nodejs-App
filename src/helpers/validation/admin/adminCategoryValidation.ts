import { check } from 'express-validator';
import { getCategoryByTitle, getCategoryById } from '../../../models/category';

export const adminCategoryStoreValidation = [
    check('category_title').trim().notEmpty().withMessage('لطفا عنوان دسته بندی را وارد نمایید')
    .custom(async (value: string) => {
        let category = await getCategoryByTitle(value);
       
        if(category) {
            throw new Error('عنوان دسته بندی از قبل در سامانه ثبت شده است. لطفا عبارت دیگری انتخاب نمایید.');
        }
    }),
    check('category_parent').trim().notEmpty().withMessage('لطفا سطح دسته بندی را وارد نمایید')
]

export const adminCategoryUpdateValidation = [
    check('category_title').trim().notEmpty().withMessage('لطفا عنوان دسته بندی را وارد نمایید')
    .custom(async (value: string, { req }) => {
        let category

        if(req.query._method === 'PUT') {
            category = await getCategoryById(req.params.id);
           
            if(category.categoryTitle === value) {
                return;
            }
        }

        category = await getCategoryByTitle(value);
       
        if(category) {
            throw new Error('این دسته بندی از قبل در سامانه ثبت شده است. لطفا نام دیگری انتخاب نمایید');
        }
    }),
    check('category_parent').trim().notEmpty().withMessage('لطفا سطح دسته بندی را وارد نمایید')
]