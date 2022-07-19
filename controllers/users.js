const bcrypt = require('bcryptjs');
var nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const User = require('../models/user');
const Role = require('../models/role');
const fileHelper = require('../util/file');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'zizooo.elhor@gmail.com',
        pass: 'weezwkafdhwmpmdk'
    }
});
const ITEMS_PER_PAGE = 2;

exports.getAllUsers = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    User.find()
        .countDocuments()
        .then(numUsers => {
            totalItems = numUsers;
            return User.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
                .select('_id name age'); // => to select specific fields
        })
        .then((allUsers) => {
            res.render('users/users-list', {
                path: '/users-list',
                pageTitle: 'Users',
                users: allUsers,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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
    const image = req.file;

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
            fileHelper.deleteFile(req.file?.path);
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
                    roleId: roleId,
                    imageUrl: image?.path
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
            // .then((error, info) => {
            //     if (error) {
            //         const error = new Error(err);
            //         error.httpStatusCode = 500;
            //         return next(error);
            //     } else {
            //         console.info('Email sent: ' + info.response);
            //     }
            // })
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
                let imageUrl;
                if (req.file) {
                    fileHelper.deleteFile(req.body.imageUrl);
                    imageUrl = req.file.path;
                }
                else {
                    imageUrl = req.body.imageUrl;
                }
                return User.updateOne({ _id: req.body.id },
                    {
                        name: req.body.name,
                        password: hashedPassword,
                        age: req.body.age,
                        description: req.body.description,
                        roleId: req.body.roleId,
                        imageUrl: imageUrl
                    });
            })
            .then(() => res.redirect('/users-list'))
            .catch(err => {
                fileHelper.deleteFile(req.file.path);
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.deleteUser = (req, res, next) => {
    const userId = req.params.userId;
    User.findById(userId)
        .then(user => {
            if (!user) {
                return next(new Error('User not found.'));
            }
            fileHelper.deleteFile(user.imageUrl);
            return User.deleteOne({ _id: userId });
        })
        .then(() => {
            res.status(200).json({ message: 'Success!' });
        })
        .catch(err => {
            res.status(500).json({ message: 'Deleting user failed.' });
        });
};

exports.getPdfUser = (req, res, next) => {
    const userId = req.params.userId;
    User.findById(userId)
        .populate('roleId', 'name')
        .then(user => {
            if (!user) {
                return next(new Error('No user found.'));
            }
            const userFileName = 'user-' + userId + '.pdf';
            const userFilePath = path.join('data', 'pdf', userFileName);

            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + userFileName + '"'
            );
            pdfDoc.pipe(fs.createWriteStream(userFilePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(30).text(user.name, {
                underline: true
            });
            pdfDoc.text('-----------------------');
            pdfDoc.font('Helvetica-Bold').text('Age: ', {
                continued: true
            }).font('Helvetica').text(user.age);
            pdfDoc.font('Helvetica-Bold').text('Description: ', {
                continued: true
            }).font('Helvetica').text(user.description);
            pdfDoc.font('Helvetica-Bold').text('Role: ', {
                continued: true
            }).font('Helvetica').text(user.roleId.name);

            pdfDoc.text('---');
            if (user.imageUrl)
                pdfDoc.image(user.imageUrl, 430, 15, { fit: [100, 100], align: 'center', valign: 'center' })
                    .rect(430, 15, 100, 100).stroke()
                    .text('', 430, 0);

            pdfDoc.end();
        })
        .catch(err => next(err));
};