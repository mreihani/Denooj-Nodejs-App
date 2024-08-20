import express from 'express';
import axios from 'axios';
import { PaymentModel } from '../../../../../models/payment';
import { OrderModel, getAllOrders, calculateOrderNumber } from '../../../../../models/order';
import { v4 as uuidv4 } from 'uuid';
const soap = require('soap');
import ShortUniqueId from 'short-unique-id';
import { emptyCart } from './cartController';
require('dotenv').config();
import { createUniqueResNum } from '../../../../../models/payment';

export const getPayment = async(req: express.Request, res: express.Response) => {
    try {
        return res.send({csrfToken: req.csrfToken()});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const postPayment = async (req: express.Request, res: express.Response) => {
    try {
        // first get items in the cart
        const cart = (req.session.cart == null || req.session.cart == undefined) ? {} : req.session.cart;

        // cart is empty
        if(Object.keys(cart).length === 0) {
            res.sendStatus(400);
        } 

        interface Item {
            price: number;
            qty: number;
            item: any;
        }

        // calculate total price in the cart
        const totalPrice :any = Object.values(cart.items).reduce((total :number, item :Item) :number => total + item.price, 0);

        // add product id and quantity and price to an object and save it in products on order
        let products: { _id: string, qty: number, price: number }[] = Object.entries(cart.items).map(([_id, item]: [string, Item]) => (
            { _id: _id, qty: item.qty, price: item.price, productTitle: item.item.productTitle }
        ));

        // get an array of product ids
        const productsIdArray = Object.keys(cart.items);
        const lotteryNumbers = await calculateOrderNumber(productsIdArray);
        
        const resNumber = await createUniqueResNum();
        
        let payament = new PaymentModel({
            resnumber: resNumber
        });
        await payament.save();

        let order = new OrderModel({
            user: req.session.userId,
            payment: payament._id,
            orderNumber: lotteryNumbers[0],
            lotteryNumbers: JSON.stringify(lotteryNumbers),
            products: products,
            price: totalPrice,
            status: 'preparation',
            // address: '',
            // postalCode: '',
            // orderNote: ''
        });
        await order.save();


        // TO DO
        // add sellingCount for each product in product model and after successful payment, it should count+
        // and also, add each order Id to product model, after successful payment, so that you can track specific product all orders
        // remember to clear cart after successful payment


        // Create the SOAP client
        const LoginAccount = process.env.PARSIAN_PAYMENT_GATEWAY_PIN;
        const gatewayUrl = 'https://pec.shaparak.ir/NewIPGServices/Sale/SaleService.asmx?wsdl';

        // Make a SOAP request
        const requestData = {
            LoginAccount: LoginAccount,
            OrderId: resNumber,
            Amount: totalPrice * 10,
            CallBackUrl: 'https://denooj.com/api/bank-gateway/callback',
            AdditionalData: '',
            Originator: ''
        };

        soap.createClientAsync(gatewayUrl).then((client :any) => {
            return client.SalePaymentRequestAsync({ requestData:  requestData });
        }).then((result :any) => {
            return res.json(result[0]);
        });
       
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const callback = async (req: express.Request, res: express.Response) => {
    try {

        const params = req.query;
        const LoginAccount = process.env.PARSIAN_PAYMENT_GATEWAY_PIN;
        const gatewayUrl = 'https://pec.shaparak.ir/NewIPGServices/Confirm/ConfirmService.asmx?wsdl';

        if(params.status !== '0') {
            return res.json({ status : 'failed'});
        }

        // Make a SOAP request to confirm payment
        const requestData = {
            LoginAccount: LoginAccount,
            Token: params.Token,
        };

        soap.createClientAsync(gatewayUrl).then((client :any) => {
            return client.ConfirmPaymentAsync({requestData});
        }).then(async (result :any) => {
            if(result[0].ConfirmPaymentResult.Status === 0) {

                const filter = { resnumber: params.OrderId };
                const update = { 
                    status: true,
                    resnumber: params.OrderId,
                    refnumber: result[0].ConfirmPaymentResult.Token,
                    tranceNo: params.STraceNo,
                    amount: params.Amount,
                    rrn: result[0].ConfirmPaymentResult.RRN,
                    securePan: result[0].ConfirmPaymentResult.CardNumberMasked
                };

                await PaymentModel.findOneAndUpdate(filter, update, {
                    returnOriginal: false
                });

                // clear cart after successful payment
                req.session.cart = {};

                return res.json({ status : 'success'});
            } else {
                return res.json({ status : 'failed'});
            } 
        });

    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}