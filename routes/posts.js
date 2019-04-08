var express = require('express');
    router = express.Router(),
    multer = require('multer'),
    upload = multer({ dest: 'uploads/' }),
    fs = require('fs'),
    bcrypt = require('bcrypt-nodejs'),
    mongoose = require('mongoose'),
    mongoXlsx = require('mongo-xlsx');

var userList = require('../db/User'),
    complaintList = require('../db/complaint'),
    backupList = require('../db/backup'),
    xlsxList = require('../db/xlsx'),
    profileList = require('../db/profile');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
            }
        });
var loggedin = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}

var admin = function (req, res, next) {
    if (req.user.type == 'admin') {
      next();
    } else {
      res.redirect('/');
    }
  }

router.post("/index", upload.any(), function(req, res){

    
    var inputString = req.body.inputString;
    var newData = req.body;
    console.log(req.files);
    // fs.readFile(req.files.image.path, function (err, data) {

    //     var imageName = req.files.image.name;

    //     /// If there's an error
    //     if(!imageName){

    //         console.log("There was an error")

    //     } else {

    //       var newPath = __dirname + "/uploads/fullsize/" + imageName;

    //       /// write file to uploads/fullsize folder
    //       fs.writeFile(newPath, data, function (err) {

    //         /// let's see it
    //         // res.redirect("/uploads/fullsize/" + imageName);

    //       });
    //     }
    // });
    console.log(newData);
    var spawn = require("child_process").spawn;
    var process = spawn('python',["./hello.py",inputString]);

     process.stdout.on('data', function(data) {
        
        var output = [{answer: data.toString()}];
        res.render("query", {output: output});
        console.log(output);
    
    });
});

router.post( '/complaint',(req, res) => {
    complaintList.find({userName: req.user.username}, function(err, list){
        // var id = list;
        var requestId = mongoose.Types.ObjectId().toString();
        var subject = req.body.subject,
            comp = req.body.complaint;
        var complaint = new complaintList({
            // requestId: (list.length+1)+req.user.username,
            requestId: requestId, 
            userName: req.user.username, 
            subject : req.body.subject, 
            solved : false,
            type: req.user.type,
            complaint : req.body.complaint
            });
            var back = new backupList({
                requestId: requestId, 
                userName: req.user.username, 
                subject : req.body.subject, 
                solved : false,
                type: req.user.type,
                complaint : req.body.complaint
            });
            back.save(function(err, neswCreate){
                if(err){
                    console.log("error in editing profile");
                }
                else{
                    console.log("Editing  Successsful!!!");
                }
            });
        complaint.save(function(err, newCreate){
            if(err){
                console.log("error in complaint");
                console.log(complaint);
            }else{
                console.log('successful complaint!!!');

                userList.find({type: 'admin'}, function(err, mailList){
                    const html = `Hi there,
                                        <br/>
                                        A new complaint has been registered.
                                        <br/>
                                        Subject: ${subject}
                                        <br/>
                                        Complaint: ${comp} 
                                        <br/><br/>
                                        Have a pleasant day.`;
                            mailList.forEach(function(mail){
                                console.log(mail);
                                if (mail.mail != undefined){
                                const mailOptions = {
                                    from: process.env.EMAIL, // sender address
                                    to: mail.mail,
                                    subject: 'New Grievance!!!', // Subject line
                                    html: html,// plain text body
                                   
                                };
    
                                transporter.sendMail(mailOptions, function (err, info) {
                                    if(err)
                                        console.log(err)
                                    else
                                        console.log(info);
                                });
                            }
                            });
                        
                });
                //mail
                
                //end
                res.redirect('/'+req.user.username);
            }
        });
    });
});

router.post( '/editprofile',(req, res) => {
    console.log(req.user.username);
    var password = req.body.password
    var profile = new profileList({
        userName: req.user.username, 
        firstname : req.body.firstname,
        lastname : req.body.lastname, 
        dob : req.body.dob, 
        type : req.body.type,
        gender : req.body.gender,
        roll : req.body.roll
        });
    
        profileList.find({}, function(err, listOfProfile){
            if (err){
                    console.log("error in profile list!!!");
            }else{
                if(listOfProfile.length != 0){
                    profileList.findOneAndUpdate({userName: req.user.username},
                        {
                            userName: req.user.username, 
                            firstname : req.body.firstname,
                            lastname : req.body.lastname, 
                            dob : req.body.dob, 
                            course : req.body.course,
                            gender : req.body.gender,
                            roll : req.body.roll
                        }
                        , {upsert:true}, function(err, newCreate){
                        if(err){
                            console.log("error in editing profile");
                        }
                        else{
                            console.log(profileList.createdAt, profileList.updatedAt);
                            console.log("Editing  Successful!!!");
                            userList.findOne({
                                username: req.user.username
                            }, function (err, doc) {
                                if (err) {
                                    res.status(500).send('error occured')
                                } else {
                                    if(doc) {
                                        userList.findOneAndUpdate({username: req.user.username},
                                            {
                                                username : req.user.username,
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
                                                }
                                            });
                                                // res.redirect('/login');
                                        }
                                    }
                                });
                            res.redirect('/'+req.user.username+'/profile');
                        }
                    });
                }else {
                    profile.save(function(err, newCreate){
                        if(err){
                            console.log("error in editing profile");
                        }
                        else{
                            console.log("Editing  Successful!!!");
                            res.redirect('/'+userName+'/profile');
                        }
                    });            
                }
            }
        });
});


router.post('/discardRequest', function(req, res){
    var requestId = req.body.comparator;
    
        complaintList.deleteOne({ requestId: requestId }, function (err) {
            if (err) {
                console.log('error in deletion of request!!!');
            }
            else{
                console.log('de++++++++++++++');
                res.redirect('/');
            }
        });
});

router.post('/solveRequest', function(req, res){
    var requestId = req.body.requestId;
    
        complaintList.findOneAndUpdate({requestId: requestId},
            {
                solved: true
            }
            , {upsert:true}, function(err, newCreate){
            if(err){
                console.log("error in editing profile");
            }
            else{
                console.log("Editing  Successful!!!");
                backupList.findOneAndUpdate({requestId: requestId},
                    {
                        solved: true
                    }
                    , {upsert:true}, function(err, newCreate){
                    if(err){
                        console.log("error in editing profile");
                    }
                    else{
                        console.log("Editing  Successful!!!");
                        
                    }
                });
                res.redirect('/');
            }
        });
    
});

router.post('/deleteAccount', loggedin, admin, function(req, res){
    var username = req.body.username;
    console.log(username);
    userList.deleteOne({ username: username }, function (err) {
        if (err) {
            console.log('error in deletion of request!!!');
        }
        else{
            profileList.deleteOne({userName: username}, function (err){
                if (err){
                    console.log("error in deletion");
                }else {
                    complaintList.deleteMany({userName: username}, function(err){
                        if (err){
                            console.log('error in deleteion');
                        }else {
                            res.redirect('/userslist/success');
                        }
                    });
                }
            });
        }
      });
});

router.post( '/grantAccess',(req, res) => {
    var username = req.body.username,
        type = req.body.type;

    console.log(username);
    console.log(type);
    userList.findOneAndUpdate({username: username},
        {
            type: type
        }
        , {upsert:true}, function(err, newCreate){
        if(err){
            console.log("error in editing profile");
        }
        else{
            console.log("Editing  Successful!!!");
            complaintList.updateMany({userName: username},
                {
                    type: type
                }
                ,{upsert: true}, function(err, newlist){
                    if(err){
                        console.log("error in editing profile");
                    }
            });
            profileList.findOneAndUpdate({userName: username},
                {
                    type: type
                }
                ,{upsert: true}, function(err, newlist){
                    if(err){
                        console.log("error in editing profile");
                    }
            });
            res.redirect('/'+req.user.username+'/privilege/success');
        }
    });
    
});

router.post('/upload',loggedin, upload.any(), function (req, res, next) {
    var userName = req.user.username;
    console.log(req.files[0]);
    console.log("++++++++++++++++++++++++++++++++++++++++++++");
	profileList.find({userName: userName}, function(err, prof){
        var img = prof[0].image;
        profileList.findOneAndUpdate({userName: req.user.username},
            { 
                image : req.files[0].filename
            }
            , {upsert:true}, function(err, newCreate){
            if(err){
                console.log("error in editing profile");
            }
            else{
                console.log("Editing  Successful!!!");
                console.log(img);
                console.log(prof);
                if (img != undefined && img != 'default'){
                fs.unlink('public/uploads/'+img, (err) => {
                    if (err) throw err;
                    console.log('successfully deleted');
                  });
                }
                res.redirect('/index');
            }
        });
    });
});

router.post('/generateXlsx', function(req, res){
    var dt = req.body.date+"T06:01:17.171Z",
        mail = req.body.mail;
        var path = [];
        console.log(dt);

    complaintList.find({ createdAt: { $gte: dt } }, function(err, dat){
        var data = [];
        console.log(dat);
        dat.forEach(function(d){
            data.push({requestId: d.requestId, userName:d.userName, subject:d.subject, solved:d.solved,type:d.type,complaint:d.complaint,createdAt:Date(d.createdAt)});
        });
        var model = mongoXlsx.buildDynamicModel(data);
        console.log(data);
        mongoXlsx.mongoData2Xlsx(data, model, function(err, data) {
            console.log('File saved at:', data.fullPath); 
            console.log(data);
            path.push({path:data.fullPath});
            
            var attachments = attachments = [{ filename: 'Grievance.xlsx', path: data.fullPath, contentType: 'xlsx' }]; 
                        const html = `Hi there,
                                        <br/>
                                        Here is the Grievance report!!
                                        <br/><br/>
                                        Please find your attachment.
                                        <br/><br/>
                                        Have a pleasant day.`;
                            const mailOptions = {
                                from: process.env.EMAIL, // sender address
                                to: mail,
                                subject: 'Grievance status report', // Subject line
                                html: html,// plain text body
                                attachments:  attachments
                            };

                            transporter.sendMail(mailOptions, function (err, info) {
                                if(err)
                                    console.log(err)
                                else
                                    console.log(info);
                            }); 

                        var xlsx = new xlsxList({
                            path: data.fullPath
                            });
                        xlsx.save(function(err, newCreate){
                            if(err){
                                console.log("error in editing profile");
                            }
                            else{
                                console.log("Editing  Successful!!!");
                            }
                        });   
                            
          });
    });
    xlsxList.find({}, function(err, doc){
        if (doc.length != 0){
            console.log(doc[0].path);
          fs.unlink(doc[0].path, (err) => {
            if (err) {
                console.log('error in unlink');
            }
            console.log(doc);
          });
        }
        xlsxList.deleteOne({path: doc[0].path}, function(err){
            if (err){
                console.log('error in deleteion');
            }
        });
    });
    
    res.redirect('/generateXlsx');
});

router.post('/feedback', function(req, res){
    var sub = req.body.subject,
        text = req.body.complaint,
        username = req.user.username;
        
        userList.find({type: 'admin'}, function(err, mailList){
            const html = `Hi there,
                                <br/>
                                A new feedback has been registered!!!
                                <br/>
                                Subject: ${sub}
                                <br/>
                                Feedback: ${text}
                                <br/>
                                Posted by: ${username} 
                                <br/>
                                <br/>
                                Have a pleasant day.`;
                    mailList.forEach(function(mail){
                        console.log(mail);
                        if (mail.mail != undefined){
                        const mailOptions = {
                            from: 'hellofoobar137@gmail.com', // sender address
                            to: mail.mail,
                            subject: 'New FeedBack!!!', // Subject line
                            html: html,// plain text body
                           
                        };

                        transporter.sendMail(mailOptions, function (err, info) {
                            if(err)
                                console.log(err)
                            else
                                console.log(info);
                        });
                    }
                });
                
        });
        res.redirect('/feedback');
});

module.exports = router;