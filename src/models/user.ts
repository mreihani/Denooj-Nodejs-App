import mongoose from "mongoose";
import { mongoosePagination, Pagination } from 'mongoose-paginate-ts';

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
    },
    emailAddress: {
        type: String,
        required: false,
    },
    avatar: {
        type: String,
        required: false,
        default: null
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    twoFactorAuth: {
        type: Boolean,
        default: false
    },
    rememberMe: {
        type: Boolean,
        default: false
    },
    gender: {
        type: String,
        enum: ['male','female']
    },
    authentication: {
        password: {
            type: String,
            required: false,
            select: false
        },
        salt: {
            type: String,
            required: false,
            select: false
        },
        sessionToken: {
            type: String, 
            select: false
        },
        sessionTokenCreatedAt: {
            type: Date,
            default: Date.now()
        }
    },
}, {
   timestamps: true, 
   toJSON: { virtuals: true },
});

// set one to many relation from user to activeCode
userSchema.virtual('activeCode', {
    ref: 'ActiveCode',
    localField: '_id',
    foreignField: 'user',
});

userSchema.plugin(mongoosePagination);

type User = mongoose.Document & {
    userTitle: String,
};

export const UserModel = mongoose.model('User', userSchema);

export const getUsers = () => UserModel.find();
export const getUserByEmail = (emailAddress: string) => UserModel.findOne({emailAddress});
export const getUserByPhone = (phone: string) => UserModel.findOne({phone});
export const getUserBySessionToken = (sessionToken: string) => UserModel.findOne({
    'authentication.sessionToken': sessionToken
});
export const getUserById = (id: string) => UserModel.findById(id);
export const createUser = (values: Record<string, any>) => new UserModel(values).save().then((user :any) => user.toObject());
export const deleteUserById = (id: string) => UserModel.findOneAndDelete({_id: id});
export const updateUserById = (id: string, values: Record<string, any>) => UserModel.findByIdAndUpdate(id, values);
export const paginatedUser = () => mongoose.model<User, Pagination<User>>("User", userSchema);
export const deleteNotVerifiedUsers = (phone: string) => UserModel.deleteMany({phone, phoneVerified: {$eq: false}});