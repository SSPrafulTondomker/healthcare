var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

var profileSchema = new mongoose.Schema({
    userName: String, 
    firstname: String,
    lastname : String, 
    image : String,
    dob : String,
    type : String,
    course : String, 
    gender : String,
    roll : String 
});

profileSchema.plugin(timestamps);
module.exports = mongoose.model('profileList',profileSchema,'profileList');
