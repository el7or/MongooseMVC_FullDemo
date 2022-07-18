const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const User = require('../models/user');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'zizooo.elhor@gmail.com',
        pass: 'weezwkafdhwmpmdk'
    }
});

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        validationErrors: null
    });
};

exports.postLogin = (req, res, next) => {
    const name = req.body.name;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            validationErrors: errors.array()
        });
    }
    else {
        let loginUser;
        User.findOne({ name: name })
            .populate('roleId', 'name') //=> to add child data from Role model
            .then(user => {
                loginUser = user;
                if (!loginUser) {
                    req.flash('error', 'Invalid username or password.');
                    return res.redirect('/login');
                }
                return bcrypt.compare(password, loginUser.password)
                    .then(isPasswordMatch => {
                        if (isPasswordMatch) {
                            req.session.isLoggedIn = true;
                            req.session.user = loginUser;
                            req.session.userRoleName = loginUser.roleId.name;
                            return req.session.save(err => {
                                if (err) {
                                    const error = new Error(err);
                                    error.httpStatusCode = 500;
                                    return next(error);
                                }
                                res.redirect('/');
                            });
                        }
                        else {
                            req.flash('error', 'Invalid username or password.');
                            res.redirect('/login');
                        }
                    }).catch(err => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
        res.redirect('/login');
    });
};

exports.getReset = (req, res, next) => {
    res.render('auth/reset-password', {
        path: '/reset-password',
        pageTitle: 'Reset Password'
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
        const token = buffer.toString('hex');
        User.findOne({ name: req.body.name })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that name found.');
                    return res.redirect('/reset-password');
                }
                return User.updateOne({ _id: user._id }, { resetToken: token, resetTokenExpiration: Date.now() + 3600000 });
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    from: 'zizooo.elhor@gmail.com',
                    to: 'zizooo.el7or@gmail.com', //req.body.email
                    subject: 'Password reset',
                    html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/new-password?token=${token}">link</a> to set a new password.</p>`
                }).then((error, info) => {
                    if (error) {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    } else {
                        console.info('Email sent: ' + info.response);
                    }
                });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.query.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                userId: user._id.toString(),
                passwordToken: token,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};