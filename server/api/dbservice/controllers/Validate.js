/**
 * Mongo DB validation
 */

var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var BotDetailSchema = require('../models/BotDetailModel');
var jsonReply = "";

router.get('/', validate);

module.exports = router;


/**
 * Validate project name in MONGO DB 
 */
function validate(req, res) {

  console.log('project name validation in Mongo DB started !!');

  if (req.query != undefined && req.query.project_name != undefined) {

    var botInstance = req.query.project_name;
    
    BotDetailSchema.find({ bot_instance: botInstance }).populate().exec(function (err, results) {

      if (err) {
        console.error(err);
        res.send(err);
      }
      else {
        console.log('MongoDB --> ' + JSON.stringify(results));
        if (results.length == 0) {
          jsonReply = { msg: "new instance",status:1 };
          res.json(jsonReply);
        }
        else {
          jsonReply = { msg: "Instance is already in use.",status : 0 };
          res.json(jsonReply);
        }
      }
    });
  }
  else {
    jsonReply = { msg: "missing/invalid parameters",status : -1 };
    res.json(jsonReply);
  }
}




