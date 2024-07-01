import mongoose from "mongoose";
const Schema = mongoose.Schema;
import {mongoosePagination, Pagination} from 'mongoose-paginate-ts';
import { CategoryModel } from "./category";

const productSchema = new mongoose.Schema({
    category: {
        type: Schema.Types.ObjectId, ref: 'Category'
    },
    productTitle: {
        type: String,
        required: true
    },
    productSlug: {
        type: String,
        required: true
    },
    productWeight: {
        type: String,
        required: false
    },
    productPrice: {
        type: String,
        required: true
    },
    productDiscountedPrice: {
        type: String,
        required: false
    },
    stockAvailable: {
        type: Boolean,
        required: false
    },
    productStatus: {
        type: Boolean,
        required: false
    },
    images: {
        image_500x500: {
            type: String,
            required: false
        },
        image_275x454: {
            type: String,
            required: false
        }
    },
    shortDesc: {
        type: String,
        required: true
    },
    longDesc: {
        type: String,
        required: true
    },
    metaTitle: {
        type: String,
        required: false
    },
    metaDescription: {
        type: String,
        required: false
    },
    metaKeywords: {
        type: String,
        required: false
    },
    sellingCount: {
        type: Number,
        required: false,
        default: null
    },
    recommendedProduct: {
        type: Boolean,
        required: false
    },
    northProduct: {
        type: Boolean,
        required: false
    },
    economyProduct: {
        type: Boolean,
        required: false
    }
}, {
   timestamps: true,
   toJSON: { virtuals: true } 
});

productSchema.plugin(mongoosePagination);

export const ProductModel = mongoose.model('Product', productSchema);

export const getProducts = () => ProductModel.find().sort({createdAt: "descending"});
export const getProductsBySlug = (slug: string) => ProductModel.findOne({ productSlug: slug });
export const getProductsByTitle = (title: string) => ProductModel.findOne({ productTitle: title });
export const getProductById = (id: string) => ProductModel.findById(id);
export const createProduct = (values: Record<string, any>) => new ProductModel(values).save().then((product :any) => product.toObject());
export const deleteProductById = (id: string) => ProductModel.findOneAndDelete({_id: id});
export const updateProductById = (id: string, values: Record<string, any>) => ProductModel.findByIdAndUpdate(id, values);

type Product = mongoose.Document & {
    productTitle: String,
};

export const paginatedProducts = () => mongoose.model<Product, Pagination<Product>>("Product", productSchema);

