import mongoose from "mongoose";
const Schema = mongoose.Schema;

module.exports = function Cart(oldCart :any) {
    this.items = oldCart.items || {};
   
    this.add = function(item :any, quantity: any) {
        let storedItem = this.items[item._id];

        if(!storedItem) {
            storedItem = this.items[item._id] = {item: item, qty: 0, price: 0}
        }

        storedItem.qty += quantity;

        // decide if product is discounted or not, if discount available, then set discounted as real price
        const price = (storedItem.item.productDiscountedPrice == null 
            || storedItem.item.productDiscountedPrice == "" 
            || storedItem.item.productDiscountedPrice == 0
            || storedItem.item.productDiscountedPrice == "0"
        ) ? storedItem.item.productPrice : storedItem.item.productDiscountedPrice;

        storedItem.price = parseInt(price) * storedItem.qty;
    }

    this.remove = function(item :any, quantity: any) {
        let storedItem = this.items[item._id];

        if(!storedItem) {
            storedItem = this.items[item._id] = {item: item, qty: 0, price: 0}
        }

        storedItem.qty -= quantity;

        // decide if product is discounted or not, if discount available, then set discounted as real price
        const price = (storedItem.item.productDiscountedPrice == null 
            || storedItem.item.productDiscountedPrice == "" 
            || storedItem.item.productDiscountedPrice == 0
            || storedItem.item.productDiscountedPrice == "0"
        ) ? storedItem.item.productPrice : storedItem.item.productDiscountedPrice;

        storedItem.price = parseInt(price) * storedItem.qty;
    }

    this.clear = function(item :any, quantity: any) {
        let storedItem = this.items[item._id];

        if(!storedItem) {
            storedItem = this.items[item._id] = {item: item, qty: 0, price: 0}
        }
    }
}


