const Role = require('../models/role');

const ITEMS_PER_PAGE = 2;

exports.getAllRoles = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Role.find()
        .countDocuments()
        .then(numUsers => {
            totalItems = numUsers;
            return Role.findWithUsersCount()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then((allRoles) => {
            res.render('roles/roles-list', {
                path: '/roles-list',
                pageTitle: 'Roles',
                roles: allRoles,
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