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




//Index page route
router.get('/index', loggedin, (req,res) => {
    console.log("user is logged in!!!");
    var output = [{answer: "Your answer will appear here"}];
    res.render('index', {output: output});
});


//Query page route
router.get('/query', loggedin, (req,res) => {
    console.log("user is logged in!!!");
    var output = [{answer: "Your answer will appear here"}];
    res.render('query', {output: output});
});

//Index page route
router.get('/', loggedin, (req,res) => {
    console.log("user is logged in!!!");
    res.redirect('/'+req.user.username);
});


//signout route
router.get('/signout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

//signout route
router.get('/login', function (req, res) {
    res.render('login');
});

//register route
router.get('/register', function (req, res) {
    res.render('register', {error: false});
});

//verify route
router.get('/verify', function (req, res) {
    res.render('verify');
});

//forgot-paword route
router.get('/forgot-password', function (req, res) {
    res.render('forgot-password');
});


//success route
router.get('/success', loggedin, (req,res) => {
    console.log("user is logged in!!!");
    profileList.find({userName: req.user.username},function(err, type){

        if (req.user.type == 'admin') {
            complaintList.find({}, function(err, list){
                if (err){
                        console.log("error in complaint list!!!");
                }else{
                    var solved, unsolved;
                    solved = 0;
                    unsolved = 0;
                    list.forEach(function(l){
                        if (l.solved){
                            solved += 1;
                        } else {
                            unsolved += 1;
                        }
                    });
                    
                    backupList.find({}, function(err, discard){
                        res.render('home', {success: true, type: type, list: list, solved: solved, unsolved: unsolved, total: list.length, discarded: discard.length});
                    });
                    
                }
            });
        } else {
        complaintList.find({userName: req.user.username}, function(err, list){
            if (err){
                    console.log("error in complaint list!!!");
            }else{
                var solved, unsolved;
                solved = 0;
                unsolved = 0;
                list.forEach(function(l){
                    if (l.solved){
                        solved += 1;
                    } else {
                        unsolved += 1;
                    }
                });
                backupList.find({}, function(err, discard){
                    // console.log(discard);
                    res.render('home', {success: true, type: type, list: list, solved: solved, unsolved: unsolved, total: list.length, discarded: discard.length});
                });
                
            }
        });
        }  
    });
});


//user index route
router.get('/:username', loggedin, (req,res) => {
    console.log("user is logged in!!!");
    profileList.find({userName: req.user.username},function(err, type){

        if (req.user.type == 'admin') {
            complaintList.find({}, function(err, list){
                if (err){
                        console.log("error in complaint list!!!");
                }else{
                    var solved, unsolved;
                    solved = 0;
                    unsolved = 0;
                    list.forEach(function(l){
                        if (l.solved){
                            solved += 1;
                        } else {
                            unsolved += 1;
                        }
                    });
                    
                    backupList.find({}, function(err, discard){
                        res.render('home', {success: false, type: type, list: list, solved: solved, unsolved: unsolved, total: list.length, discarded: discard.length});
                    });
                    
                }
            });
        } else {
        complaintList.find({userName: req.user.username}, function(err, list){
            if (err){
                    console.log("error in complaint list!!!");
            }else{
                var solved, unsolved;
                solved = 0;
                unsolved = 0;
                list.forEach(function(l){
                    if (l.solved){
                        solved += 1;
                    } else {
                        unsolved += 1;
                    }
                });
                backupList.find({}, function(err, discard){
                    // console.log(discard);
                    res.render('home', {success: false, type: type, list: list, solved: solved, unsolved: unsolved, total: list.length, discarded: discard.length});
                });
                
            }
        });
        }  
    });
});


//verification
router.get('/:username/:token', function(req, res, next){
   
    userList.find({$and: [{username: req.params.username}, {token: req.params.token}]}, function(err, listOfItems){
        if (err){
                console.log("error in getting list of items!! in /:username");
        }else{
            if (listOfItems.length != 0){
                userList.findOneAndUpdate({username: req.params.username},
                    {
                        activate : true, 
                    }
                    , {upsert:true}, function(err, newCreate){
                    if(err){
                        console.log("error in editing profile");
                    }
                });
            res.redirect('/success');
        }
            console.log(listOfItems);
 
            next();
            console.log("successfully executed list command!! in /:username/success");
        }
    });
    
});


//page not found route
router.get ('*', (req, res) => {
    console.log("page not found!!!");
    res.render('404');
});
module.exports = router;
