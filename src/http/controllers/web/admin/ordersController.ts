import express from 'express';
import validator from 'validator';
import { paginatedOrders, OrderModel } from '../../../../models/order';
import { getUserById } from '../../../../models/user';
import fs from 'fs';
var moment = require('moment-jalaali');

export const orderIndex = async(req: express.Request, res: express.Response) => {

    let page :any = req.query.page || 1;
    
    const options = {
        page: page, 
        limit: 5,
    };

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
        {
            $match: { 'paymentDetails.status': true }
        },
    ]);

    OrderModel
    .aggregatePaginate(myAggregate, options)
    .then(async function(results) {
        let data = {
            title: 'لیست سفارشات',
            url: req.path,
            orders: results,
            success: req.flash('success'),
            errorSingleMessage: req.flash('errorSingleMessage'),
            errors: req.flash('errors'),
            formData: req.flash('formData')[0],
            user: await getUserById(req.session.userId),
        }
   
        res.render('pages/orders', {data});
    });
}

export const orderShow = async(req: express.Request, res: express.Response) => {
    try {
        let order :Record<string, any> = await OrderModel.findById(req.params.id).populate([
            { path: 'user', select: '_id firstname lastname phone emailAddress avatar' },
            { path: 'payment', select: '_id tranceNo rrn securePan status' },
        ]).exec();
        
        if(!order) {
            req.flash("errorSingleMessage", "چنین سفارشی یافت نشد!");
            return res.redirect('/admin/orders');
        }
       
        let data = {
            title: 'نمایش جزئیات سفارش',
            url: req.path,
            success: req.flash('success'),
            errorSingleMessage: req.flash('errorSingleMessage'),
            errors: req.flash('errors'),
            formData: req.flash('formData')[0],
            user: await getUserById(req.session.userId),
            order: order,
            createdAtJalaliDate: moment(order.createdAt).format('jYYYY/jM/jD HH:mm:ss')
        }

        return res.render('pages/orders/view', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const orderDestroy = async(req: express.Request, res: express.Response) => {
   
    try {
        let order :Record<string, any> = await OrderModel.findById(req.params.id);
       
        if(!order) {
            req.flash("errorSingleMessage", "چنین سفارشی یافت نشد!");

            return res.redirect('/admin/orders');
        }

        await order.deleteOne();
        
        req.flash("success", "سفارش مورد نظر با موفقیت حذف شد");

        return res.redirect('/admin/orders');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const orderSearch = async(req: express.Request, res: express.Response) => {
    try {
        let query:any = {};
        let search: any = req.query.q;
        let trimmedSearch = search.trim();
      
        if(trimmedSearch) {
            query.orderNumber = new RegExp(trimmedSearch, 'gi');
            query.firstname = new RegExp(trimmedSearch, 'gi');
            query.lastname = new RegExp(trimmedSearch, 'gi');
            query.fullname = new RegExp(trimmedSearch, 'gi');
            query.phone = new RegExp(trimmedSearch, 'gi');
            query.emailAddress = new RegExp(trimmedSearch, 'gi');
        }

        const orders: any = await OrderModel.aggregate([
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
            {
                $match: { 
                    'paymentDetails.status': true,
                    $or: [
                        { 'orderNumber': query.orderNumber },
                        { 'userDetails.firstname': query.firstname },
                        { 'userDetails.lastname': query.lastname },
                        { 'userDetails.fullname': query.fullname },
                        { 'userDetails.phone': new RegExp((trimmedSearch).replace(/^0+/, ''), 'gi') },
                        { 'userDetails.emailAddress': query.emailAddress },
                    ]
                }
            },
        ]).exec();

        let data = {
            title: 'جستجوی سفارشات',
            url: req.path,
            orders: orders,
            search: trimmedSearch,
            user: await getUserById(req.session.userId)
        }
        
        return res.render('pages/orders/search', {data});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const orderUpdate = async(req: express.Request, res: express.Response) => {
    try {
        let order :Record<string, any> = await OrderModel.findById(req.params.id);
       
        if(!order) {
            req.flash("errorSingleMessage", "چنین سفارشی یافت نشد!");

            return res.redirect('/admin/orders');
        }

        const { 
            status, 
            trackingSerial, 
        } = req.body;

        const cleanedStatus = validator.escape(status);
        const cleanedTrackingSerial = validator.escape(trackingSerial);

        const filter = { _id: req.params.id };
        const update = { 
            status: cleanedStatus,
            trackingSerial: cleanedTrackingSerial,
        };

        await OrderModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });
        
        req.flash("success", "سفارش مورد نظر با موفقیت بروزرسانی شد");

        return res.redirect('/admin/orders');
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}




