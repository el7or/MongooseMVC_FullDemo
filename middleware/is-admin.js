module.exports = (req, res, next) => {
    if (req.session.userRoleName !== 'Admin') {
        req.flash('error', `You don't have permission!`);
        //return res.redirect('back');
        return res.redirect(req.get('referer'));
    }
    next();
}