var express = require('express');
var router = express.Router();
var User = require('../db/User');
var randomstring = require('randomstring');
var bcrypt = require('bcrypt-nodejs');
var profileList = require('../db/profile');
require('dotenv').config();
/* GET home page. */


module.exports = function (passport) {

    router.post('/signup', function (req, res) {
        
        var body = req.body,
            username = body.username,
            mail = body.email,
            type = "user",
            password = body.password,
            firstname = "";
        
            // Generate secret token
        var secretToken = randomstring.generate();
        User.findOne({
            username: username
        }, function (err, doc) {
            if (err) {
                res.status(500).send('error occured')
            } else {
                if (doc) {
                    res.render('register', {error: true});
                } else {
                    var record = new User()
                    record.username = username;
		            record.mail = mail;
                    record.password = record.hashPassword(password);
                    record.token = secretToken;
                    record.activate = false;
                    record.type = type;

                    var profile = new profileList({
                        userName: username, 
                        firstname : firstname,
                        lastname : "", 
                        dob : "", 
                        image : "default",
                        type : type,
                        gender : "",
                        roll : ""
                        });
                        profile.save(function(err, newCreate){
                            if(err){
                                console.log("error in editing profile");
                            }
                            else{
                                console.log("Editing  Successful!!!");
                            }
                        });  
                    
                        record.save(function (err, user) {
                        if (err) {
                            res.status(500).send('db error')
                        } else {
                            var nodemailer = require('nodemailer');

                            var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: process.env.EMAIL,
                                    pass: process.env.EMAIL_PASS
                                }
                            });
                            const html = `Hi there,
                                        <br/>
                                        Thank you for registering!
                                        <br/><br/>
                                        Please verify your email by clicking the following link:
                                        
                                        <a href="${process.env.HOST_LINK}/${username}/${secretToken}">activate</a>
                                        <br/><br/>
                                        Have a pleasant day.`;
                            const mailOptions = {
                                from: process.env.EMAIL, // sender address
                                to: mail,
                                subject: 'Activation link', // Subject line
                                html: html// plain text body
                            };

                            transporter.sendMail(mailOptions, function (err, info) {
                                if(err)
                                    console.log(err)
                                else
                                    console.log(info);
                            });
                            res.redirect('/verify');
                        }
                    })
                }
            }
        })
    });

    //forgot
    router.post('/forgot', function (req, res) {
        var body = req.body,
            username = body.username,
            password = randomstring.generate(7);
        User.findOne({
            username: username
        }, function (err, doc) {
            if (err) {
                res.status(500).send('error occured')
            } else {
                if(doc) {
                    User.findOneAndUpdate({username: username},
                        {
                            username : username,
                            mail : doc.mail,
                            password : bcrypt.hashSync(password,bcrypt.genSaltSync(10)),
                            token : doc.secretToken,
                            activate : doc.activate,
                            type : doc.type  
                        }
                        , {upsert:true}, function(err, newCreate){
                        if(err){
                            console.log("error in forgot password!");
                        }
                        else{
                            console.log("Editing  Successful!!!");
                            var nodemailer = require('nodemailer');

                            var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: process.env.EMAIL,
                                    pass: process.env.EMAIL_PASS
                                }
                            });
                            const html = `Hi there,
                                        <br/>
                                        Thank you for joining us!
                                        <br/><br/>
                                        Please use this password for log in!
                                        Username:
                                        ${username}
                                        <br/><br/>
                                        password:
                                        ${password}
                                        <br/><br/>
                                        Have a pleasant day.`;
                            const mailOptions = {
                                from: process.env.EMAIL, // sender address
                                to: doc.mail,
                                subject: 'New Generated Password', // Subject line
                                html: html// plain text body
                            };

                            transporter.sendMail(mailOptions, function (err, info) {
                                if(err)
                                    console.log(err)
                                else
                                    console.log(info);
                            });
                            res.redirect('/login');
                        }
                    });
                }
            }
        });
    });


    //verify again
    //forgot
    router.post('/verifyAgain', function (req, res) {
        var body = req.body,
            username = body.username,
            secretToken = randomstring.generate();
        User.findOne({
            username: username
        }, function (err, doc) {
            if (err) {
                res.status(500).send('error occured')
            } else {
                if(doc) {
                    User.findOneAndUpdate({username: username},
                        {
                            username : username,
                            mail : doc.mail,
                            password : doc.password,
                            token : secretToken,
                            activate : doc.activate,
                            type : doc.type
                        }
                        , {upsert:true}, function(err, newCreate){
                        if(err){
                            console.log("error in forgot password!");
                        }
                        else{
                            console.log(username);
                            console.log("Editing  Successful!!!");
                            var nodemailer = require('nodemailer');

                            var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: process.env.EMAIL,
                                    pass: process.env.EMAIL_PASS
                                }
                            });
                            const html = `Hi there,
                                            <br/>
                                            Thank you for registering!
                                            <br/><br/>
                                            Please click on the link to verify your email:
                                            <a href="${process.env.HOST_LINK}/${doc.username}/${secretToken}">activate</a>
                                            <br/><br/>
                                            Have a pleasant day.`;
                            const mailOptions = {
                                from: process.env.EMAIL, // sender address
                                to: doc.mail,
                                subject: 'Activation link', // Subject line
                                html: html// plain text body
                            };

                            transporter.sendMail(mailOptions, function (err, info) {
                                if(err)
                                    console.log(err)
                                else
                                    console.log(info);
                            });
                            res.redirect('/login');
                        }
                    });
                }
            }
        });
    });


    router.post('/signin', passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/success',
    }), function (req, res) {
        res.send("done");
    })
    return router;
};
