import express from 'express';
import axios from 'axios';
import { PaymentModel } from '../../../../../models/payment';
import { OrderModel, getAllOrders, calculateOrderNumber } from '../../../../../models/order';
import { v4 as uuidv4 } from 'uuid';
const soap = require('soap');
import ShortUniqueId from 'short-unique-id';

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
        
        // const resNumber :string = uuidv4();
        const uid = new ShortUniqueId({ length: 19, dictionary: 'number' });
        const resNumber = uid.randomUUID();
        
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
            // address: 2,
            // postalCode: 3,
            // orderNote: 4
        });
        await order.save();


        // TO DO
        // add sellingCount for each product in product model and after successful payment, it should count+
        // and also, add each order Id to product model, after successful payment, so that you can track specific product all orders
        // remember to clear cart after successful payment


        // Create the SOAP client
        const gatewayUrl = 'https://pec.shaparak.ir/NewIPGServices/Sale/SaleService.asmx?wsdl';
        soap.createClient(gatewayUrl, function(err :any, client :any) {
            if (err) {
                console.error('Error creating SOAP client:', err);
                return;
            }
         
          // Make a SOAP request
            const requestData = {
                LoginAccount: '6405hRYLc117Q0Elp2P8',
                OrderId: resNumber,
                Amount: totalPrice * 10,
                CallBackUrl: 'https://denooj.com/api/bank-gateway/callback',
                AdditionalData: '',
                Originator: ''
            };

            client.SalePaymentRequest({ requestData:  requestData }, function(err :any, result :any) {
                if (err) {
                    console.error('Error making SOAP request:', err);
                    return;
                }

                return res.json(result);
            });
        });
       
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const callback = async (req: express.Request, res: express.Response) => {
    try {

        console.log(req.query);

        return res.json(req.query);

        // if(req.query.Status && req.query.Status !== 'OK') {
        //     //res.redirect();
        // }

        // let payment = (await PaymentModel.findOne({resnumber: req.query})).populated('product').exec();

        // if(!payment.product) {
        //     // return
        // }

        // let params = {
        //     MerchantId: 'awdwad684',
        //     Amount: 1000,
        //     Authority: 1
        // }

        // // Send a POST request
        // axios({
        //     method: 'POST',
        //     url: 'https://www.zarinpal.com/pg/rest',
        //     headers: {
        //         'cache-control' : 'no-cache',
        //         'Content-Type': 'application/json'
        //     },
        //     data: params
        // }).then(async function (response) {
        //     let payment = new PaymentModel({
        //         user: req.session.userId,
        //         product: {},
        //         resnumber: "",
        //         price: ""
        //     });

        //     await payment.save();

        //     res.redirect(`https://www.zarinpal.com/pg/${response}`);
        // });

        // return res.json(payment);

    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}