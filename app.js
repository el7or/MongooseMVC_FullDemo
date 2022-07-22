const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
//const https = require('https');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const errorsController = require('./controllers/errors');
//const User = require('./models/user');

// const MONGODB_URI =
//     'mongodb+srv://node_test:node_test@cluster0.u9j79.mongodb.net/test-node?retryWrites=true&w=majority';
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.u9j79.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const port = 3000;
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'images') },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
});
// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg')
//         cb(null, true);
//     else
//         cb(null, false);

// };

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' } //=> to append new logs to the file without delete old logs
);

// const httpsOptions = {
//     key: fs.readFileSync('./security/cert.key'),
//     cert: fs.readFileSync('./security/cert.pem')
// }

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(helmet()); //=> add important headers to response (for production)
app.use(compression()); //=> to minimize assets files (for production)
app.use(morgan('combined', { stream: accessLogStream })); //=> for logging

app.use(bodyParser.urlencoded({ extended: false }));
//app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(multer({ storage: fileStorage }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.isAdmin = req.session.userRoleName === 'Admin';
    res.locals.csrfToken = req.csrfToken();
    res.locals.flashMessages = req.flash();
    next();
});

// //=> set current user data
// app.use((req, res, next) => {
//     if (!req.session.user) {
//         return next();
//     }
//     User.findById(req.session.user._id)
//         .then(user => {
//             if (!user) {
//                 return next();
//             }
//             req.user = user;
//             next();
//         })
//         .catch(err => {
//             next(new Error(err));
//         });
// });

app.use(indexRoutes);
app.use(authRoutes);
app.use(usersRoutes);
app.use(rolesRoutes);

app.use(errorsController.get404);
app.use(errorsController.get500);

mongoose.connect(MONGODB_URI).then(result => {
    app.listen(port, () => console.log(`app listening on http://localhost:${port}`));
    // https.createServer(httpsOptions, app) //=> to add SSL to localhost
    //     .listen(port, () => { console.log(`app listening on https://localhost:${port}`) })
}).catch(err => console.error(err));