import mongoose from "mongoose";
const Schema = mongoose.Schema;
import { mongoosePagination, Pagination } from 'mongoose-paginate-ts';
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const orderSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    products: [{
        _id: String,
        productTitle: String,
        qty: Number,
        price: Number,
    }],
    payment: {
        type: Schema.Types.ObjectId,
        ref: 'Payment',
    },
    orderNumber: {
        type: String,
        required: false
    },
    lotteryNumbers: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['preparation','posted','cancelled', 'returned']
    },
    trackingSerial: {
        type: String,
        required: false,
        default: null
    },
    orderNote: {
        type: String,
        required: false,
        default: null
    },
}, {
   timestamps: true,
   toJSON: { virtuals: true } 
});

// orderSchema.plugin(mongoosePagination);
orderSchema.plugin(aggregatePaginate);

export const OrderModel = mongoose.model('Order', orderSchema);
export const getAllOrders = () => OrderModel.find().sort({createdAt: "descending"});
export const getOrderById = (id: string) => OrderModel.findById(id);
export const createOrder = (values: Record<string, any>) => new OrderModel(values).save().then((order :any) => order.toObject());
export const deleteOrderById = (id: string) => OrderModel.findOneAndDelete({_id: id});
export const updateOrderById = (id: string, values: Record<string, any>) => OrderModel.findByIdAndUpdate(id, values);

// calculate order number starting from 10000 for the lottery
export const calculateOrderNumber = async(productsIdArray :any[]) => {
    const allOrders = await OrderModel.find().sort({createdAt: -1});
    let orderNumber: number[] = [];
    if(allOrders.length == 0) {
        for (let i = 0; i < productsIdArray.length; i++) {
            orderNumber.push(10000 + i);
        }
    } else {
        let latestOrderItemNumberArray = JSON.parse(allOrders[0].lotteryNumbers);
        let lastIndexOfLatestOrderItemNumberArray = latestOrderItemNumberArray[latestOrderItemNumberArray.length - 1];
        let lastOrderNumberItem = parseInt(lastIndexOfLatestOrderItemNumberArray) + 1;
        for (let i = 0; i < productsIdArray.length; i++) {
            orderNumber.push(lastOrderNumberItem + i);
        }
    }

    return orderNumber;
}

type Order = mongoose.Document & {
    price: Number,
};
export const paginatedOrders = () => mongoose.model<Order, Pagination<Order>>("Order", orderSchema);



