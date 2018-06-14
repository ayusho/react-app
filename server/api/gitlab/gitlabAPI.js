var service = {};
var request = require('request');
var Q = require('q');
var config = require('../openshift/utility/config');
var deferred = Q.defer();

service.createBranch = createBranch;

module.exports = service;

let jsonReply = "";
//create branch 
function createBranch(branchName,callback) {
    console.log('Creating new branch on innersource ..');
    var request = require("request");

var options = { method: 'POST',
  url: 'https://innersource.soprasteria.com/api/v4/projects/4046/repository/branches',
  qs: { branch: 'TESTING', ref: 'master' },
  headers: 
   { 'Postman-Token': '52f5937f-a6f7-434a-9ad2-670266b12d8a',
     'Cache-Control': 'no-cache',
     'PRIVATE-TOKEN': 'ja1AhC7FfQdnf-gmik1i' } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});

    
}


