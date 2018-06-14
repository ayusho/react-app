var express = require('express');
var router = express.Router();
var request = require('request');

var keycloakConfig = require('./keycloak.json');
var fs = require('fs');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var Q = require('q');
var request = require("request");

var OpenshiftToken = require('../openshift/utility/OpenshiftToken');
var authenticateString = "";
var jsonReply = "";

router.post('/', authenticates);
// router.get('/git',gitlab);

module.exports = router;

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
//innerAuth authentication

function authenticates(req, res) {
  console.log('Authentication has started ...');

  if (req.body != undefined && req.body.uid != undefined && req.body.password != undefined) {

    var userId = req.body.uid;
    var password = req.body.password;

    console.log(userId + " " + password);

    var url = keycloakConfig.auth_server_url + '/realms/' + keycloakConfig.realm + '/protocol/openid-connect/token';
    /**
     * Request to Keycloak server
     */
    request.post({
      url: url,
      form: {
        username: userId,
        password: password,
        grant_type: 'password',
        client_id: keycloakConfig.client_id,
        client_secret: keycloakConfig.credentials.secret
      }
    }, function (err, httpResponse, body) {

      if (err) {
        console.log('Error while post request ' + err);
      }
      else {

        var jsonResponse = JSON.parse(httpResponse.body);

        if (jsonResponse.error == 'invalid_grant' || jsonResponse.error_description == 'Invalid user credentials') {
          authenticateString = { token: null, msg: "Invalid credentisals", status: 0 };
          res.json(authenticateString);
          console.log('invalid user/password');
        }

        if (jsonResponse.error === undefined && jsonResponse.access_token !== undefined) {

          console.log('Token -- ' + jsonResponse.access_token);
          var decoded = jwt.decode(jsonResponse.access_token);
          var user_email = decoded.email;
          console.log('User email ' + user_email);
          OpenshiftToken.getSessionToken(userId, password, function (sessionToken) {
            console.log('Openshift token ' + sessionToken);
            authenticateString = { token: sessionToken, email: user_email, status: 1 };
            res.json(authenticateString);
          })
        }
      }
    });
  }
  else {
    jsonReply = { msg: "missing/invalid parameters", status: 0 }
    res.json(jsonReply);
  }
}


// function gitlab(req,res){

//   var request = require("request");
  
//   var options = { method: 'POST',
//     url: 'https://innersource.soprasteria.com/api/v4/projects/4034/repository/branches',
//     qs: { branch: 'TESTING', ref: 'master' },
//     headers: 
//      { 'Postman-Token': '34069cc4-c961-7edb-f86a-6ec6ef0963c6',
//        'Cache-Control': 'no-cache',
//        'PRIVATE-TOKEN': 'ja1AhC7FfQdnf-gmik1i' } };
  
//   request(options, function (error, response, body) {
//     if (error) throw new Error(error);
  
//     console.log(body);
//   });
  
// }