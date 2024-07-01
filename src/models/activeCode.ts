import mongoose from "mongoose";
const Schema = mongoose.Schema;
import crypto from 'crypto';
import {mongoosePagination, Pagination} from 'mongoose-paginate-ts';
import { getUserById, UserModel } from './user';

const activeCodeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    code: {
        type: String,
        required: true
    },
    expiredAt: {
        type: Date 
    }
});

export const ActiveCodeModel = mongoose.model('ActiveCode', activeCodeSchema);

export const verifyCode = async(code :string, id :string) => {
    let aliveCode = await getAliveCodeForUser(id, code);

    if(aliveCode =! null && aliveCode == code) {
        return true
    }

    return false;
}

export const generateCode = async(id: any) => {

    let code;

    if(await getAliveCodeForUser(id) != null) {
        code = await getAliveCodeForUser(id);
    } else {
        let randomInt;
        do {
            randomInt = crypto.randomInt(0, 100000).toString().padStart(5, "0");
        }
        while(await checkCodeIsUnique(id, randomInt));

        // calculate expire date for 2 minutes
        let now = new Date();
        let expDate =  now.setMinutes(now.getMinutes() + 2);

        const activeCode: any = await new ActiveCodeModel({
            user: id,
            code: randomInt,
            expiredAt: expDate
        }).save();
      
        code = activeCode.code;
    }

    // remove all expired codes
    await clearAllExpiredActiveCodes();

    return code;
};

// check if the code is unique and has not been generated for the user already
export const checkCodeIsUnique = async(id :string, code :string) => {
    let user = await UserModel.findById(id).populate({
        path: 'activeCode',
        match: { code: { $eq: code } },
    }).exec();

    // @ts-ignore
    let activeCodeObj = user.activeCode;
    let isCodeUnique = false;
    if(activeCodeObj.length) {
        isCodeUnique = true;
    } 
    return isCodeUnique;
}

// get a code for the user which is still valid and has not expired
export const getAliveCodeForUser :any = async(id :string) => {
    let now = new Date();
    let user = await UserModel.findById(id).populate({
        path: 'activeCode',
        match: { expiredAt: {$gte: now.toISOString()} },
    }).exec();

    // @ts-ignore
    let activeCodeObj = user.activeCode;
    let lastCode = null;
    if(activeCodeObj.length) {
        lastCode = activeCodeObj[activeCodeObj.length - 1].code;
    } 
   
    return lastCode; 
}

// clear all active codes which are expired
export const clearAllExpiredActiveCodes = async() => {
    let now = new Date();
    await ActiveCodeModel.find({expiredAt: { $lt: now.toISOString() }}).deleteMany();
}
