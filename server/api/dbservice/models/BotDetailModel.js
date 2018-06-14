'use strict';
var mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

/**
 * @class models/BotDetail
 * @description Model of BotDetail
 */

var schema = new Schema({

    
    project_name: { type: String , required: true, trim: true },
    project_description: { type: String },
    username : {type : String},
    uid : { type: Number },
    


});
schema.plugin(uniqueValidator);
module.exports = mongoose.model('BotDetail', schema,'BotDetail');