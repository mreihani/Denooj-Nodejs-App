import express from 'express';
import { loginIndex, loginAttempt, loginSmsVerify } from '../../http/controllers/web/auth/adminLoginController';
import { homeIndex } from '../../http/controllers/web/admin/indexController';
import { profileIndex } from '../../http/controllers/web/admin/profileController';
import { accountSettingsIndex, accountSettingsUserProfileUpdate, accountSettingsUserPasswordUpdate, accountSettingsUserPhoneUpdate } from '../../http/controllers/web/admin/accountSettingsController';
import { isAdminAuthenticated, redirectFromLogin } from '../../http/middlewares/index';
import { loginAttemptValidation, loginVerificationValidation } from '../../helpers/validation/admin/adminAuthValidation';
import { adminUserStoreValidation, adminUserUpdateValidation } from '../../helpers/validation/admin/adminUserValidation';
import { adminProductStoreValidation, adminProductUpdateValidation } from '../../helpers/validation/admin/adminProductValidation';
import { adminAccountSettingsUserProfileUpdateValidation, adminAccountSettingsUserPasswordUpdateValidation, adminAccountSettingsUserPhoneUpdateValidation } from '../../helpers/validation/admin/adminAccountSettingsValidation';
import { adminCategoryStoreValidation, adminCategoryUpdateValidation } from '../../helpers/validation/admin/adminCategoryValidation';
import { logout } from '../../http/controllers/web/auth/adminLogoutController';
import { productIndex, productCreate, productStore, productEdit, productUpdate, productDestroy, productSearch } from '../../http/controllers/web/admin/productsController';
import { categoryIndex, categoryCreate, categoryStore, categoryEdit, categoryUpdate, categoryDestroy, categorySearch } from '../../http/controllers/web/admin/categoriesController';
import { userIndex, userCreate, userStore, userEdit, userUpdate, userDestroy, userSearch, seedReza } from '../../http/controllers/web/admin/usersController';
import { orderIndex, orderDestroy, orderSearch, orderShow, orderUpdate } from '../../http/controllers/web/admin/ordersController';

export default (router: express.Router) => {

    // admin login page
    router.get('/login', redirectFromLogin, loginIndex);
    router.post('/login', loginAttemptValidation, redirectFromLogin, loginAttempt);
    router.post('/login/verify', loginVerificationValidation, redirectFromLogin, loginSmsVerify);

    // admin logout
    router.get('/logout', logout);
    
    // dashboard home page
    router.get('/dashboard', isAdminAuthenticated, homeIndex);

    // profile page routes
    router.get('/profile', isAdminAuthenticated, profileIndex);
    router.get('/account-settings', isAdminAuthenticated, accountSettingsIndex);
    router.put('/account-settings/user-profile/update/:id', isAdminAuthenticated, adminAccountSettingsUserProfileUpdateValidation, accountSettingsUserProfileUpdate);
    router.put('/account-settings/user-password/update/:id', isAdminAuthenticated, adminAccountSettingsUserPasswordUpdateValidation, accountSettingsUserPasswordUpdate);
    router.put('/account-settings/user-phone/update/:id', isAdminAuthenticated, adminAccountSettingsUserPhoneUpdateValidation, accountSettingsUserPhoneUpdate);

    // categories route
    router.get('/category', isAdminAuthenticated, categoryIndex);
    router.get('/category/create', isAdminAuthenticated, categoryCreate);
    router.post('/category/store', isAdminAuthenticated, adminCategoryStoreValidation, categoryStore);
    router.get('/category/:id/edit', isAdminAuthenticated, categoryEdit);
    router.put('/category/update/:id', isAdminAuthenticated, adminCategoryUpdateValidation, categoryUpdate);
    router.delete('/category/destroy/:id', isAdminAuthenticated, categoryDestroy);
    router.get('/category/search', isAdminAuthenticated, categorySearch);

    // user management route
    router.get('/user', isAdminAuthenticated, userIndex);
    router.get('/user/create', isAdminAuthenticated, userCreate);
    router.post('/user/store', adminUserStoreValidation, isAdminAuthenticated, userStore);
    router.get('/user/:id/edit', isAdminAuthenticated, userEdit);
    router.put('/user/update/:id', isAdminAuthenticated, adminUserUpdateValidation, userUpdate);
    router.delete('/user/destroy/:id', isAdminAuthenticated, userDestroy);
    router.get('/user/search', isAdminAuthenticated, userSearch);

    // products route
    router.get('/product', isAdminAuthenticated, productIndex);
    router.get('/product/create', isAdminAuthenticated, productCreate);
    router.post('/product/store', isAdminAuthenticated, adminProductStoreValidation, productStore);
    router.get('/product/:id/edit', isAdminAuthenticated, productEdit);
    router.put('/product/update/:id', isAdminAuthenticated, adminProductUpdateValidation, productUpdate);
    router.delete('/product/destroy/:id', isAdminAuthenticated, productDestroy);
    router.get('/product/search', isAdminAuthenticated, productSearch);

    // orders route
    router.get('/orders', isAdminAuthenticated, orderIndex);
    router.get('/order/:id', isAdminAuthenticated, orderShow);
    router.delete('/order/destroy/:id', isAdminAuthenticated, orderDestroy);
    router.get('/orders/search', isAdminAuthenticated, orderSearch);
    router.put('/order/update/:id', isAdminAuthenticated, orderUpdate);

    // delete this seeder after production
    // router.get('/seed-reza-user', seedReza);
}

