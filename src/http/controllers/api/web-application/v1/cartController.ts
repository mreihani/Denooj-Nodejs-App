import express from 'express';
import { ProductModel, getProductById } from '../../../../../models/product';

let Cart = require('../../../../../models/cart');

export const getCart = async(req: express.Request, res: express.Response) => {
    try {
        const cart = (req.session.cart == null || req.session.cart == undefined) ? {} : req.session.cart;
       
        // remove products that have been deleted by the admin, or have been disabled or not in stock from cart
        let product;
        let cartItems = cart.items;
        for (const itemId in cartItems) {
            if (cartItems.hasOwnProperty(itemId)) {
                product = await getProductById(itemId);
                if(!product || !product.productStatus || !product.stockAvailable) {
                    delete cartItems[itemId];
                }
            }
        }
        
        return res.json({
            cart: (cartItems == null || cartItems == undefined) ? {} : Object.entries(cartItems), 
            csrfToken: req.csrfToken()
        });
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const addToCart = async (req: express.Request, res: express.Response) => {
    try {
        const {id, quantity} = req.body;

        let cart = new Cart(req.session.cart ? req.session.cart : {});

        let product :Record<string, any> = await ProductModel.findById(id);

        if(!product) {
            return res.json("چنین محصولی یافت نشد!");
        }

        cart.add(product, Math.ceil(quantity));
        req.session.cart = cart;
        
        return res.json(req.session.cart);
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const removeFromCart = async (req: express.Request, res: express.Response) => {
    try {
        const {id, quantity} = req.body;
        
        let cart = new Cart(req.session.cart ? req.session.cart : {});
        let product :Record<string, any> = await ProductModel.findById(id);

        if(!product) {
            return res.json("چنین محصولی یافت نشد!");
        }

        // do not allow the product quantity to become below 1
        const currentProductQuantityInCart = cart.items[id].qty;
        if(currentProductQuantityInCart < 2) {
            return res.sendStatus(400);
        }

        cart.remove(product, Math.ceil(quantity));
        req.session.cart = cart;
        
        return res.json(req.session.cart);
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const clearItemFromCart = async (req: express.Request, res: express.Response) => {
    try {
        const {id} = req.body;
        
        let cart = new Cart(req.session.cart ? req.session.cart : {});
        let product :Record<string, any> = await ProductModel.findById(id);

        if(!product) {
            return res.json("چنین محصولی یافت نشد!");
        }

        const currentProductQuantityInCart = cart.items[id].qty;

        cart.clear(product, currentProductQuantityInCart);
        // remove selected item from array
        delete cart.items[id];

        req.session.cart = cart;
        
        return res.json(req.session.cart);
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const updateCart = async (req: express.Request, res: express.Response) => {
  
    try {
        req.body.cartItems
        const { cartItems } = req.body;

        // first clear session cart items
        req.session.cart = {}
        let cart = new Cart({})

        for (const cartItem of cartItems) {
            const {id, quantity} = cartItem;
           
            await ProductModel.findById(id).then((product) => {
                if(!product) {
                    return res.json("چنین محصولی یافت نشد!");
                }

                cart.add(product, Math.ceil(quantity));
                req.session.cart = cart;
            });
        }
        
        return res.json(req.session.cart);
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const emptyCart = async (req: express.Request, res: express.Response) => {
    try {
       
        const cart = req.session.cart = {};
        
        return res.json(cart);
    } catch(error) {
        console.log(error);
        return res.sendStatus(400);
    }
}