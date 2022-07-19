const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const errorsController = require('./controllers/errors');
//const User = require('./models/user');

const MONGODB_URI =
    'mongodb+srv://node_test:node_test@cluster0.u9j79.mongodb.net/test-node?retryWrites=true&w=majority';

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
})

// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg')
//         cb(null, true);
//     else
//         cb(null, false);

// };

app.set('view engine', 'ejs');
app.set('views', 'views');

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
}).catch(err => console.error(err));