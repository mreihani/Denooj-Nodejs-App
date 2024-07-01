import mongoose from "mongoose";
const Schema = mongoose.Schema;
import { mongoosePagination, Pagination } from 'mongoose-paginate-ts';

const paymentSchema = new mongoose.Schema({
    resnumber: {
        type: String,
        required: true
    },
    terminalId: {
        type: String,
    },
    refnumber: {
        type: String,
    },
    tranceNo: {
        type: String,
    },
    amount: {
        type: String,
    },
    rrn: {
        type: String,
    },
    securePan: {
        type: String,
    },
    status: {
        type: Boolean,
        default: false
    }
}, {
   timestamps: true,
   toJSON: { virtuals: true } 
});

paymentSchema.plugin(mongoosePagination);

export const PaymentModel = mongoose.model('Payment', paymentSchema);

export const getAllPayments = () => PaymentModel.find().sort({createdAt: "descending"});
export const getPaymentById = (id: string) => PaymentModel.findById(id);
export const createPayment = (values: Record<string, any>) => new PaymentModel(values).save().then((payment :any) => payment.toObject());
export const deletePaymentById = (id: string) => PaymentModel.findOneAndDelete({_id: id});
export const updatePaymentById = (id: string, values: Record<string, any>) => PaymentModel.findByIdAndUpdate(id, values);

type Payment = mongoose.Document & {
    paymentTitle: String,
};

export const paginatedPayment = () => mongoose.model<Payment, Pagination<Payment>>("Payment", paymentSchema);

