var express = require('express');
    router = express.Router(),
    multer = require('multer'),
    upload = multer({ dest: 'public/uploads/' }),
    fs = require('fs'),
    bcrypt = require('bcrypt-nodejs'),
    mongoose = require('mongoose'),
    mongoXlsx = require('mongo-xlsx');

var userList = require('../db/User'),
    complaintList = require('../db/complaint'),
    backupList = require('../db/backup'),
    xlsxList = require('../db/xlsx'),
    profileList = require('../db/profile');

    
var loggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
}





//profile route
router.get ('/profile', loggedin, (req, res) => {
    console.log("executed profile!!!");
    profileList.find({userName: req.user.username}, function(err, listOfProfiles){
        if (err){
                console.log("error in getting list of items!! in /:username");
        }else{
            console.log(listOfProfiles);
            res.render('profile', {listOfProfiles: listOfProfiles});
        }
    });
});

module.exports = router;
