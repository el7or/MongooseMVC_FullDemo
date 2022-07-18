exports.getIndex = (req, res, next) => {
    res.render('index', {
        path: '/',
        pageTitle: 'Home Page'
    });
};