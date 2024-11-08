module.exports = {
    database: {
        url: "mongodb://localhost/denooj_db"
    },
    port: "5000",
    loginSessionExpiryTime: 5 * 24 * 3600,
    irPhoneRegEx: /^9(1[0-9]|3[0-9]|2[0-9]|0[0-9]|9[0-9]|4[1])-?[0-9]{3}-?[0-9]{4}$/,
    sessionCookie: {
        development: {
            path: '/', 
            secure: false,
            httpOnly: true,
            maxAge: 5*24*3600*1000,
        },
        production: {
            path: '/', 
            secure: true,
            httpOnly: true,
            maxAge: 5*24*3600*1000,
            sameSite: 'strict',
        }
    }
};
