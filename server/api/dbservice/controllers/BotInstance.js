/**
 * Mongo DB interactions
 */

var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var BotDetailSchema = require('../models/BotDetailModel');
var jsonReply = "";

router.get('/all', getBotNames);
router.post('/add', insertBotInstance);
router.delete('/delete', deleteBotInstance);

module.exports = router;


/**
Get all the bot names 
 */

function getBotNames(req, res) {

  console.log('Getting all instances ..');

  if(req.query != undefined && req.query.username != undefined){
  BotDetailSchema.find({username:req.query.username},{project_name:1, _id: 0}).populate().exec(function (err, allBotInstances) {

    if (err) {
      console.error(err);
      res.send(err);
    }
    else {
      console.log('allBotInstances --> ' + allBotInstances);
      res.json(allBotInstances);
    }
  });}
  else
  {
    jsonReply = { msg: "missing/invalid params" ,status:-1};
    res.json(jsonReply);
  }

}

/**
 * Delete project from MONGO DB
 */
function deleteBotInstance(req, res) {

  console.log('Deleting Bot instance ..');
  if (req.body != undefined && req.body.project_name != undefined && req.body.username) {
    BotDetailSchema.remove({ project_name: req.body.project_name,username:req.body.username}).exec(function (err, dbResult) {

      if (err) {
        console.error(err);
        res.send(err);
      }
      else {
        console.log('Deleted');
        jsonReply = { msg: "Bot instance deleted successfully", status: 1 };
        res.json(jsonReply);
      }
    });

  }
  else {
    jsonReply = { msg: "missing/invalid params" ,status:-1};
    console.error("missing/invalid params");
    res.json(jsonReply);
  }
}

/*
Add project into MONGO DB
 */
function insertBotInstance(req, res) {

  console.log('Bot detail insertion started .. ' + req.body.project_name + " " + req.body.project_description + " " + req.body.username);
  if (req.body.project_name != undefined && req.body.project_description != undefined && req.body.username != undefined) {
    var document = new BotDetailSchema({
      project_name: req.body.project_name,
      project_description: req.body.project_description,
      username :  req.body.username
    });

    document.save(function (err, dbResult) {
      if (err) {
        console.error(err);
        jsonReply = { msg: "Error",reason : err,status:-1 };
        res.json(jsonReply); 

      }
      else {
        console.log('db --> ' + dbResult);
        jsonReply = { msg: "New instance created", status: 1 };
        res.json(jsonReply);
      }
    });
  }

  else {
    jsonReply = { msg: "Missing/invalid params",status:-1 };
    console.log(jsonReply);
    res.json(jsonReply);
  }
}