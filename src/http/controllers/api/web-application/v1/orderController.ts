import express from 'express';
import validator from 'validator';
import { paginatedOrders, OrderModel, getOrderById } from '../../../../../models/order';
import { getUserById } from '../../../../../models/user';
import mongoose from 'mongoose';

export const getUserOrderById = async(req: express.Request, res: express.Response) => {
    try {
        const orderId = req.params.id;

        // check if id is valid
        if(!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.sendStatus(400);
        }

        const order = await getOrderById(orderId).populate('user', '_id').exec();
        
        // first check if id is valid
        if(!order) {
            return res.json({
                status: 'failed',
                msg: 'هیچ سفارشی یافت نشد!'
            })
        }

        // then check if the owner is sending the request
        const userId = req.session.userId;
       
        if(order.user.id != userId) {
            return res.json({
                status: 'failed',
                msg: 'هیچ سفارشی یافت نشد!'
            })
        }

        return res.json({
            status: 'success',
            order: order, 
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const getUserOrders = async(req: express.Request, res: express.Response) => {
    
    const userId = req.session.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId); 
    
    let page :any = req.query.page || 1;
    let status :any = req.query.status;
    
    const options = {
        page: page, 
        limit: 5,
    };

    const matchStage :any = {
        $match: { 
            'paymentDetails.status': true,
            'userDetails._id': userObjectId
        }
    };

    if (status !== 'all') {
        matchStage.$match['status'] = status;
    }

    var myAggregate = OrderModel.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails',
            }
        },
        {
            $lookup: {
                from: 'payments',
                localField: 'payment',
                foreignField: '_id',
                as: 'paymentDetails'
            }
        },
        matchStage,
        {
            "$project": {
                '_id': 1,
                'orderNumber': 1,
                'price': 1,
                'status': 1,
                'createdAt': 1,
                'userDetails._id': 1,
                'userDetails.firstname': 1,
                'userDetails.lastname': 1,
                'userDetails.phone': 1,
                'products._id': 1,
                'products.productTitle': 1,
                'products.qty': 1,
                'products.price': 1,
            }
        }
    ]);

    OrderModel
    .aggregatePaginate(myAggregate, options)
    .then(async function(results) {
        return res.json(results);
    });
}

export const testRoute = async(req: express.Request, res: express.Response) => {
    const cookies = req.cookies;
    return res.json(cookies);
}