import express from 'express';
import {  getProducts, getProductsBySlug, paginatedProducts, ProductModel } from '../../../../../models/product'
import { generateCategoryHierarchy } from '../../../../../models/category'
import { isValidObjectId } from 'mongoose';

export const getAllProducts = async(req: express.Request, res: express.Response) => {
    try {
        const perPage = 10;
        const page = req.query.page;

        const products = await paginatedProducts().paginate({
            page: page || 1, 
            limit: perPage,
            sort: {
                createdAt: "descending",
            },
            query: {
                productStatus: true,
                stockAvailable: true
            }
        });

        return res.json(products);
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const getSingleProductBySlug = async(req: express.Request, res: express.Response) => {
    try {
        const productSlug = req.params.slug;
        
        // first check if product id is valid
        if(!productSlug) {
            return res.json({
                status: 'failed',
                msg: 'هیچ محصولی یافت نشد!'
            })
        }
        
        const product = await getProductsBySlug(productSlug).populate('category').exec();
        
        if(!product || !product.productStatus || !product.stockAvailable) {
            return res.json({
                status: 'failed',
                msg: 'هیچ محصولی یافت نشد!'
            })
        }

        const categoryHierarchyArray = await generateCategoryHierarchy(product.category._id);
       
        return res.json({
            status: 'success',
            product, 
            categoryHierarchyArray
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const getTaggedProducts = async(req: express.Request, res: express.Response) => {
    try {

        let products;
        const type = req.query.type;

        if(type == 'recommendedProduct') {
            products = await ProductModel.find({ 
                recommendedProduct: true,
                productStatus: true,
                stockAvailable: true 
            }).sort({ createdAt: "descending" });
        } else if(type == 'northProduct') {
            products = await ProductModel.find({
                northProduct: true ,
                productStatus: true,
                stockAvailable: true, 
            }).sort({ createdAt: "descending" });
        } else if(type == 'economyProduct') {
            products = await ProductModel.find({
                economyProduct: true,
                productStatus: true,
                stockAvailable: true, 
            }).sort({ createdAt: "descending" });
        } else if(type == 'popularProduct') {
            products = await ProductModel.find({
                productStatus: true,
                stockAvailable: true,
                sellingCount: { $ne: null }
            }).sort({ sellingCount: "descending" });
        } else {
            res.sendStatus(400);
        }

      
       
        return res.json(products);
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}