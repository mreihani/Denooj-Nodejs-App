import { forIn } from "lodash";
import mongoose from "mongoose";
const Schema = mongoose.Schema;
import { mongoosePagination, Pagination } from 'mongoose-paginate-ts';

const categorySchema = new mongoose.Schema({
    categoryTitle: {
        type: String,
        required: true
    },
    categoryParent: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, {
   timestamps: true,
   toJSON: { virtuals: true } 
});

categorySchema.plugin(mongoosePagination);

categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'categoryParent'
});

categorySchema.virtual('products', {
    ref: 'Product',
    localField: 'category',
    foreignField: '_id'
});

type Category = mongoose.Document & {
    categoryTitle: String,
};

export const CategoryModel = mongoose.model('Category', categorySchema);
export const getCategory = () => CategoryModel.find().sort({createdAt: "descending"});
export const getCategoryByTitle = (title: string) => CategoryModel.findOne({ categoryTitle: title });
export const getCategoryById = (id: string) => CategoryModel.findById(id);
export const createCategory = (values: Record<string, any>) => new CategoryModel(values).save().then((category :any) => category.toObject());
export const deleteCategoryById = (id: string) => CategoryModel.findOneAndDelete({_id: id});
export const updateCategoryById = (id: string, values: Record<string, any>) => CategoryModel.findByIdAndUpdate(id, values);
export const paginatedCategory = () => mongoose.model<Category, Pagination<Category>>("Category", categorySchema);

// find the top parent category to the top
export const generateCategoryHierarchy = async(id: any) => {
    // get an estimation of loop count
    const loopCount = await CategoryModel.find().countDocuments();

    let categoryItem;
    let categoryObjectArray = [];
    // send the first category to the array initially
    categoryObjectArray.push(await getCategoryById(id));

    for (let index = 0; index < loopCount; index++) {

        // get category item and check if it has any parent, if not break;
        categoryItem = await getCategoryById(id);
        if(categoryItem.categoryParent == null) {
            break;
        }
        
        // get that category once again and populate its parent
        categoryItem = await getCategoryById(id).populate('categoryParent').exec();

        // push parents into arrray
        categoryObjectArray.push(categoryItem.categoryParent);

        // renew id with parent id and start the loop again
        id = categoryItem.categoryParent.id;
    }

    return categoryObjectArray.reverse();
};




