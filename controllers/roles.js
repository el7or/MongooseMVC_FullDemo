const Role = require('../models/role');

exports.getAllRoles = (req, res, next) => {
    Role.findWithUsersCount()
        .then((allRoles) => {
            res.render('roles/roles-list', {
                path: '/roles-list',
                pageTitle: 'Roles',
                roles: allRoles
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getAddRole = (req, res, next) => {
    res.render('roles/role-form', {
        path: '/role-form',
        pageTitle: 'Add Role',
        role: null
    });
};

exports.postAddRole = (req, res, next) => {
    Role.create({ name: req.body.name, description: req.body.description })
        .then(() => res.redirect('/roles-list'))
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditRole = (req, res, next) => {
    Role.findById(req.params.roleId).then((role) => {
        if (!role) {
            return res.redirect('/');
        }
        res.render('roles/role-form', {
            path: '/role-form',
            pageTitle: "Edit Role",
            role: role
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postEditRole = (req, res, next) => {
    Role.updateOne({ _id: req.body.id }, { name: req.body.name, description: req.body.description })
        .then(() => res.redirect('/roles-list'))
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteRole = (req, res, next) => {
    if (req.session.userRoleName !== 'Admin') {
        req.flash('error', `You don't have permission to delete role!`);
        res.redirect('/roles-list')
    }
    else {
        Role.deleteOne({ _id: req.params.roleId })
            .then(() => res.redirect('/roles-list'))
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};