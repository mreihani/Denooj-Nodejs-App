require('dotenv').config();
import axios from "axios";

module.exports = class SmsNotification {

    phone: any;

    constructor(phone: any) { 
        this.phone = phone;
    }

    // login sms opt method
    smsLoginOpt(code :any) {
        const username = process.env.FARAZ_SMS_USERNAME;
        const password = process.env.FARAZ_SMS_PASSWORD;
        const patternCode = process.env.FARAZ_SMS_LOGIN_OPT_PATTERN_CODE;
        const fromNum = process.env.FARAZ_SMS_FROM_NUMBER;
     
        axios({
            method: 'post',
            url: 'http://ippanel.com/api/select',
            data: {
                "op":"pattern",
                "user":username,
                "pass":password,
                "patternCode":patternCode,
                "fromNum":fromNum,
                "toNum":"0"+this.phone,
                "inputData": [
                    {
                        "verification-code":code
                    }
                ]
            }
        });
    }
}


