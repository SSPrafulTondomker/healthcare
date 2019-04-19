var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

var profileSchema = new mongoose.Schema({
    username: String, 
    firstname : String,
    address : String, 
    gender : String,
    interest : {type : Array , "default" : []},
    consent : {type : Array , "default" : []},
    records : {type : Array , "default" : []},
    blood : String,
    disease : Boolean,
    medication : Boolean 
});

profileSchema.plugin(timestamps);
module.exports = mongoose.model('profileList',profileSchema,'profileList');
