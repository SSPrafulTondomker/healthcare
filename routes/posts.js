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
    
    var spawn = require("child_process").spawn;
    var process = spawn('python',["./CliNER-master/cliner predict --txt ./CliNER-master/data/examples/ex_doc.txt --out ./CliNER-master/data/predictions --model ./CliNER-master/models/silver.crf --format i2b2"]);

     process.stdout.on('data', function(data) {
        
        var output = [{answer: data.toString()}];
        res.render("query", {output: output, type : req.user.type});
    });
});

router.post("/fileSend", upload.any(), function(req, res){

    
    var filename = req.files[0].filename;
    var patient = req.body.patient;
    var doctor = req.user.username;

    profileList.find({username: patient}, function(err, patientProfile){
        var consent = patientProfile[0].consent;
        if (consent.find(function(name){return name == doctor})){
            profileList.findOneAndUpdate({username: patient},
                {
                    $push: {records : filename}
                }
                , {upsert: true}, function(err, newCreate){
                if(err){
                    console.log(err);
                }
                else{
                    res.redirect('/sendFiles');
                }
            });
        }else {
            res.redirect("/sendFiles");
        }
    });
});


router.post('/viewRecords',loggedin,  function (req, res, next) {
    var username = req.user.username;
    var patient = req.body.patient;
    
	profileList.find({username: patient}, function(err, patientProfile){
        userList.find({type: "patient"}, function(err, listOfPatients){
            res.render("viewFiles", {type: req.user.type, username: req.user.username, listOfPatients: listOfPatients, patientProfile: patientProfile});
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




module.exports = router;