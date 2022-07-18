const bcrypt = require('bcryptjs');
var nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const Role = require('../models/role');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'zizooo.elhor@gmail.com',
        pass: 'weezwkafdhwmpmdk'
    }
});

exports.getAllUsers = (req, res, next) => {
    User.find()
        .select('_id name age') // => to select specific fields
        .then((allUsers) => {
            res.render('users/users-list', {
                path: '/users-list',
                pageTitle: 'Users',
                users: allUsers
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getUserById = (req, res, next) => {
    User.findById(req.params.userId)
        .populate('roleId', 'name') //=> to add child data from Role model
        .then((user) => {
            res.render('users/user-details', {
                path: '/user-details',
                pageTitle: user.name,
                user: user
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getAddUser = (req, res, next) => {
    Role.find().then((allRoles) => {
        res.render('users/user-form', {
            path: '/user-form',
            pageTitle: 'Add User',
            user: null,
            roles: allRoles,
            validationErrors: null
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postAddUser = (req, res, next) => {
    const name = req.body.name;
    const age = req.body.age;
    const password = req.body.password;
    const description = req.body.description;
    const roleId = req.body.roleId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        Role.find().then((allRoles) => {
            return res.status(422).render('users/user-form', {
                path: '/user-form',
                pageTitle: 'Add User',
                user: req.body,
                roles: allRoles,
                validationErrors: errors.array()
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
    }
    else {
        bcrypt.hash(password, 12)
            .then(hashedPassword => {
                return User.create({
                    name: name,
                    password: hashedPassword,
                    age: age,
                    description: description,
                    roleId: roleId
                });
            })
            .then((user) => {
                res.redirect('/users-list');
                return transporter.sendMail({
                    from: 'zizooo.elhor@gmail.com',
                    to: 'zizooo.el7or@gmail.com', //user.email
                    subject: 'Added new user succeeded!',
                    html: `
                <h1>You successfully added new user:</h1>
                <p><b>Username: </b>${user.name}</p>
                <p><b>Age: </b>${user.age}</p>`
                });
            })
            .then((error, info) => {
                if (error) {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                } else {
                    console.info('Email sent: ' + info.response);
                }
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.getEditUser = (req, res, next) => {
    let allRoles;
    Role.find()
        .then((result) => {
            allRoles = result;
            return User.findById(req.params.userId);
        })
        .then((user) => {
            if (user === null) {
                console.log('Not found!');
            } else {
                res.render('users/user-form', {
                    path: '/user-form',
                    pageTitle: "Edit User",
                    user: user,
                    roles: allRoles,
                    validationErrors: null
                });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        Role.find().then((allRoles) => {
            return res.status(422).render('users/user-form', {
                path: '/user-form',
                pageTitle: "Edit User",
                user: { ...req.body, _id: req.body.id },
                roles: allRoles,
                validationErrors: errors.array()
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
    }
    else {
        bcrypt.hash(req.body.password, 12)
            .then(hashedPassword => {
                return User.updateOne({ _id: req.body.id },
                    {
                        name: req.body.name,
                        password: hashedPassword,
                        age: req.body.age,
                        description: req.body.description,
                        roleId: req.body.roleId
                    });
            })
            .then(() => res.redirect('/users-list'))
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.postDeleteUser = (req, res, next) => {
    User.deleteOne({ _id: req.params.userId })
        .then(() => res.redirect('/users-list'))
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};