import { verifyCode } from "../../../models/activeCode";
import { getUserByEmail, getUserById, getUserByPhone } from "../../../models/user";
import { body } from 'express-validator';
const config = require('../../../config/index');

export const userCheckoutValidation = [
    body('address').trim().notEmpty().withMessage('لطفا آدرس را وارد نمایید'),
    body('postalCode').trim().notEmpty().withMessage('لطفا کد پستی را وارد نمایید'),
]

