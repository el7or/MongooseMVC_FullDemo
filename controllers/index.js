const fs = require('fs');
const path = require('path');

exports.getIndex = (req, res, next) => {
    res.render('index', {
        path: '/',
        pageTitle: 'Home Page'
    });
};

exports.getPdfHelp = (req, res, next) => {
    const pdfFileName = 'test-print.pdf';
    const pdfFilePath = path.join('data', 'pdf', pdfFileName);
    // fs.readFile(pdfFilePath, (err, data) => {
    //     if (err) {
    //         return next(err);
    //     }
    //     res.setHeader('Content-Type', 'application/pdf');
    //     res.setHeader('Content-Disposition', 'attachment; filename="' + pdfFileName + '"');
    //     res.send(data);
    // });
    const file = fs.createReadStream(pdfFilePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + pdfFileName + '"');
    file.pipe(res);
};