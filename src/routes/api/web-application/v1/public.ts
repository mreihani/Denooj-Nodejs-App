import express from 'express';
import { index } from '../../../../http/controllers/api/web-application/v1/indexController';
import { getCart, addToCart, removeFromCart, updateCart, clearItemFromCart, emptyCart } from '../../../../http/controllers/api/web-application/v1/cartController';
import { getAllProducts, getSingleProductBySlug, getTaggedProducts } from '../../../../http/controllers/api/web-application/v1/productController';
import { callback, getPayment, postPayment } from '../../../../http/controllers/api/web-application/v1/paymentController';
import { isUserAuthenticated, csrfProtection } from '../../../../http/middlewares/index';
import { registerIndex, registerAttempt, registerAttemptVerifySmsCode } from '../../../../http/controllers/api/web-application/v1/registerController';
import { loginIndex, loginAttempt, loginAttemptVerifySmsCode } from '../../../../http/controllers/api/web-application/v1/loginController';
import { getUserToken, logOutApi } from '../../../../http/controllers/api/web-application/v1/authCheckController';
import { registerAttemptValidation, registerSmsCodeValidation } from '../../../../helpers/validation/user/userRegistrationValidation';
import { userProfileValidation, userProfileSmsCodeValidation } from '../../../../helpers/validation/user/userProfileValidation';
import { loginAttemptValidation, loginSmsCodeValidation } from '../../../../helpers/validation/user/userLoginValidation';
import { getUserProfile, updateUserProfile, userProfileSmsCodeVerify } from '../../../../http/controllers/api/web-application/v1/userProfileController';
import { getUserOrderById, getUserOrders } from '../../../../http/controllers/api/web-application/v1/orderController';

export default (router: express.Router) => {

    router.get('/', index);

    // register routes
    router.get('/auth/register', registerIndex);   
    router.post('/auth/register', csrfProtection, registerAttemptValidation, registerAttempt);   
    router.post('/auth/register/verify', csrfProtection, registerSmsCodeValidation, registerAttemptVerifySmsCode);   

    // login routes
    router.get('/auth/login', loginIndex);   
    router.post('/auth/login', csrfProtection, loginAttemptValidation, loginAttempt);   
    router.post('/auth/login/verify', csrfProtection, loginSmsCodeValidation, loginAttemptVerifySmsCode);   
    // retrieve session cookie
    router.get('/auth/token', getUserToken);
    router.get('/auth/logout', logOutApi);

    // cart routes
    router.get('/cart', getCart);   
    router.post('/cart/add', csrfProtection, addToCart);   
    router.post('/cart/remove', csrfProtection, removeFromCart);   
    router.post('/cart/clear', csrfProtection, clearItemFromCart);  
    router.put('/cart', csrfProtection, updateCart);   
    router.delete('/cart', csrfProtection, emptyCart);  

    // payment gateway routes
    router.get('/payment', isUserAuthenticated, getPayment);
    router.post('/payment', isUserAuthenticated, csrfProtection, postPayment);
    router.get('/payment/callback', isUserAuthenticated, callback);

    // products routes
    router.get('/products', getAllProducts);
    router.get('/product/:slug', getSingleProductBySlug);
    router.get('/products/tagged', getTaggedProducts);

    // profile routes
    router.get('/profile', isUserAuthenticated, getUserProfile);
    router.put('/profile', isUserAuthenticated, csrfProtection, userProfileValidation, updateUserProfile);
    router.post('/profile/phone-verify', isUserAuthenticated, csrfProtection, userProfileSmsCodeValidation, userProfileSmsCodeVerify);

    // order routes
    router.get('/order/:id', isUserAuthenticated, getUserOrderById);
    router.get('/orders', isUserAuthenticated, getUserOrders);

    router.get('/test', ($req, $res) => {
        return $res;
    });
}