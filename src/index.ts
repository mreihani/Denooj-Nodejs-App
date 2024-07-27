import express from 'express';
import http from 'http';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import mongoose from 'mongoose';
import flash from 'connect-flash';
import apiRouter from './routes/api/web-application/v1/index';
import webRouter from './routes/web/index';
import csrf from 'csurf';
import expressLayouts from 'express-ejs-layouts';
import fileUpload from 'express-fileupload';
import methodOverride from 'method-override';
import cors from 'cors';
import MongoStore from 'connect-mongo';
require('dotenv').config();

const config = require('./config/index');

// declare type for req.session
declare module "express-session" {
    interface SessionData {
        isLoggedIn: Boolean,
        cart: any,
        userId: string
    }
}

const expressApp = express();

// set cors
// let corsOptions;
// const ENVIRONMENT = process.env.NODE_ENV;
// if(ENVIRONMENT == 'development') {
//     corsOptions = {
//         origin: "http://localhost:3000",
//         credentials: true,
//     }
// } else if(ENVIRONMENT == 'production') {
//     corsOptions = {
//         origin: "https://denooj.com",
//         credentials: true,
//     }
// }
let corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
}
expressApp.use(cors(corsOptions));

// set file upload
expressApp.use(fileUpload());

export default class Application {
    constructor() {
        this.setupExpress();
        this.setMongoConnection();
        this.setConfig();
        this.setRouters();
    }

    setupExpress() {
        const server = http.createServer(expressApp);
        server.listen(config.port, () => {
            console.log(`Listening on port ${config.port}`);
        });
    }

    setMongoConnection() {
        mongoose.Promise = global.Promise;
        mongoose.connect(config.database.url);
    }

    setConfig() {
        //expressApp.use(express.static('public'));
        expressApp.use('/admin', express.static('public'));
        expressApp.set('view engine', 'ejs');
        expressApp.set('views', path.resolve('./src/resource/views'));
        expressApp.use(expressLayouts);
        expressApp.set("layout extractScripts", true);
        expressApp.set("layout extractStyles", true);
        expressApp.set("layout", "master");

        expressApp.use(bodyParser.json());
        expressApp.use(bodyParser.urlencoded({extended: true}));
        expressApp.use(methodOverride('_method'));
        expressApp.use(express.json());
        
        expressApp.use(session({
            secret: process.env.SESSION_SECRETKEY,
            resave: true,
            saveUninitialized: true,
            store: MongoStore.create({mongoUrl: config.database.url}),
            // cookie: { secure: true }
        }));
        
        expressApp.use(csrf());
        
        expressApp.use(cookieParser(process.env.COOKIE_SECRETKEY));

        expressApp.use(flash());
        expressApp.use(function (req, res, next) {
            res.locals.messages = require('express-messages')(req, res);
            next();
        });
    }

    setRouters() {
        expressApp.use((req, res, next) => {
            res.locals.csrfToken = req.csrfToken();
            next();
        });

        expressApp.use('/api', apiRouter());
        expressApp.use('/admin', webRouter());
    }
}

