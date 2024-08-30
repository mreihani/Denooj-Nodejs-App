import express from 'express';
import { PaymentModel } from '../../../../../models/payment';
import { getProductById } from '../../../../../models/product';
import { UserModel } from '../../../../../models/user';
import { OrderModel, getAllOrders, calculateOrderNumber } from '../../../../../models/order';
const soap = require('soap');
require('dotenv').config();
import { createUniqueResNum } from '../../../../../models/payment';
import {validationResult} from 'express-validator';
import validator from 'validator';


export const getPayment = async(req: express.Request, res: express.Response) => {
    try {
        return res.send({csrfToken: req.csrfToken()});
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const postPayment = async (req: express.Request, res: express.Response) => {

    const errors = validationResult(req);

    if(!errors.isEmpty())  {
        const errorsArray = errors.array({ onlyFirstError: true });

        return res.json(errorsArray);
    }

    try {

        const { postalCode, address } = req.body;
        
        if(!postalCode || !address) {
            return res.sendStatus(400);
        }

        const cleanedPostalCode = validator.escape(postalCode);
        const cleanedAddress = validator.escape(address);

        const filter = { _id: req.session.userId };
        let update = {
            postalCode: cleanedPostalCode,
            address: cleanedAddress,
        };

        await UserModel.findOneAndUpdate(filter, update, {
            returnOriginal: false
        });

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
            // orderNote: ''
        });
        await order.save();

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

                // add one to selling count in each product
                const currentPaymentObject = await PaymentModel.findOne({ resnumber: params.OrderId });
                const currentOrderObject = await currentPaymentObject.populate('order', 'products');
                const currentOrderProducts = currentOrderObject.order[0].products;

                for (let index = 0; index < currentOrderProducts.length; index++) {
                    let productItem = await getProductById(currentOrderProducts[index]._id);
                    productItem.sellingCount ++;
                    await productItem.save();
                }

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