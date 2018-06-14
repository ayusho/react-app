
/**
 * Openshift rest services including
 * Create a project
 * Delete a project
 * Get all projects
 * Get front end route
 */
var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var openshift = require('../src/api/openshift/config');
var Q = require('q');
var mongoose = require('mongoose');
var deferred = Q.defer();
var openshiftSrc = require('../src/api/openshift/Openshift');
var OpenshiftAPI = require('../src/api/openshift/functions');
var BotDetailSchema = require('../src/api/dbservice/models/BotDetailModel');
var res = require('response');
var expect  = require("expect");
var service = {};
//var promise = require('promise');
//var httpMocks = require('node-mocks-http');
//const supertest = require('supertest');
module.exports = service;

router.get('./login');

/* var jsonReply = "";
var template = "";
var options = "";
var openshiftToken = ""; */
var projectName = "test-demo";
var authToken = openshift.service_token;
var username = "ayush.ojha@Soprasteria.com";
module.exports = router;

getAllProjects_test(request,res);
createProject_test(request,res);
createTemplate_test();
deleteproject_test(request,res);
callAPI_test();
getRoutes_test(request,res);
getImage_test(request,res);
//callDeployConfig_test(projectName, authToken, username, "", function(message){});
var optionsForGetAllProjects = "";
var optionsForCreateProject = "";
var optionsForDeleteproject = "";
var optionsForGetroutes = "";

beforeAll(()=>{
   
    optionsForGetAllProjects = { method: 'GET',
    url: 'http://localhost:4000/api/openshift/projects',
    qs: 
    { username: 'ayojha',    token: 'B7fnEEiiwLazgQPKhfajK7J7E6rFPXerOOsJXnhnAt0' },  //,    token: 'B7fnEEiiwLazgQPKhfajK7J7E6rFPXerOOsJXnhnAt0'
    headers: 
    { 'Postman-Token': '2719a7cd-2531-4431-8a86-2d82388b52a4',
        'Cache-Control': 'no-cache' } 
    };
   
    optionsForCreateProject = { method: 'POST',
    url: 'http://localhost:4000/api/openshift/project/create',
    headers: 
     { 'Postman-Token': '95aa3cf2-c351-4aa9-8e87-524271b8cb98',
       'Cache-Control': 'no-cache',
       'Content-Type': 'application/json' },
    body: 
     { project_name: 'test-demo',
       display_name: 'test-demo',
       project_description: 'test-demo',
       username: 'ayush.ojha@Soprasteria.com',
       token: openshift.service_token },
       json: true
     };

     optionsForDeleteproject = { method: 'DELETE',
     url: 'http://localhost:4000/api/openshift/project/delete',
     headers: 
      { 'Postman-Token': 'd550bd72-4b68-4e50-9eba-d87d554959ea',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json' },
     body: 
      { project_name: 'test-demo',
        username: 'ayojha',
        token: 'B7fnEEiiwLazgQPKhfajK7J7E6rFPXerOOsJXnhnAt0' },
        json: true 
    };

     optionsForGetroutes = { method: 'GET',
     url: 'http://localhost:4000/api/openshift/project/routes',
     qs: 
      { project_name: 'alison-bot',
        token: 'nIgh2BQCTHbc-JoUom2K1HTv-M8QNTBHObFO23WGTOg' },
    };

    optionsForGetImage = { method: 'GET',
    url: 'http://localhost:4000/api/openshift/project/getimage',
    qs: 
    { username: 'ayojha',    token: 'B7fnEEiiwLazgQPKhfajK7J7E6rFPXerOOsJXnhnAt0' },  //,    token: 'B7fnEEiiwLazgQPKhfajK7J7E6rFPXerOOsJXnhnAt0'
    headers: 
    { 'Postman-Token': '2719a7cd-2531-4431-8a86-2d82388b52a4',
        'Cache-Control': 'no-cache' } 
    };

});

afterEach((done)=>{
done();
});

/**
 * Getting all the projects of user from Openshift
 * @param {*} req 
 * @param {*} res 
 */
function getAllProjects_test(req, res) {
    var request = require('request');
    describe("getAllProjects() ...",function(){
    test("Get All Project API UnitTest....", function(done){
   
    request(optionsForGetAllProjects, function (error, response, body) {
    if (error) throw new Error(error);
    
    var msg = JSON.parse(body);
    //console.log(msg.msg);
    if(msg.status!== undefined && msg.status.toString() === '0') {
        //console.log(msg.msg);
        expect(msg.status).toBe(0)
        done();
    }
    else {
    expect(body.length).toBeGreaterThan(0);
    done();
    }
    });  

   /*  var request = require('supertest');
     request = request("http://10.135.158.127:4000/api/openshift/projects");
    request.get('').query({username:'ayojha', token: 'B7fnEEiiwLazgQPKhfajK7J7E6rFPXerOOsJXnhnAt0'})
    .expect(200, function(err,res){
       if(err)
       console.log(err);

       console.log("Length="+JSON.stringify(res));
        done();
    });  */

});
});
}
 
/**
 * Delete project on Openshift
 * @param {*} req 
 * @param {*} res 
 */
function deleteproject_test(req,res) {
    var request = require("request");
    describe("deleteproject()........",function(){
    test("Delete Project UnitTest", function(done){
     request(optionsForDeleteproject, function (error, response, body) {
  if (error) throw new Error(error);

  //console.log(body);
  var msg = JSON.parse(JSON.stringify(body));
  var status = JSON.stringify(msg.status);
  if( status == 0) {
    //console.log(msg.msg);
    expect(status).toBe('0');
    done();
  }
  else if(status.toString() == -1) {
    //console.log(msg.msg);
    expect(status).toBe('-1');
    done();
  }
  else {
    //console.log(msg.msg);
    expect(status).toBe('1');
    done();
  } 
});
});
});
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Create project on Openshift 
 */
function createProject_test(req, res) {
    describe("createProject()........",function(){
       
    jest.setTimeout(50000);
    test("Create Project UnitTest", function(done){
    var request = require("request");
    
    request(optionsForCreateProject, function (error, response, body) {
      if (error) throw new Error(error);
    
      //console.log(body);
      var msg = JSON.parse(JSON.stringify(body));
      //console.log("Result=="+JSON.stringify(msg));
        var code = JSON.stringify(msg.code);
        //console.log("Compare Object=="+code);
        if( code == 200) {
            //console.log(msg.status);
            //console.log("status111==>>"+code);
            expect(code).toBe('200');
            done();
        }
       /*  else if(code.toString() == -1) {
            console.log(msg.msg);
            console.log("status222==>>"+code);
            expect(code).equals('-1');
            done();
        }
        else {
            console.log(msg.code);
            console.log("status333==>>"+code);
            expect(code).equals('1');
            done();
        }  */
});
}); 
}); 
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function getRoutes_test(req, res) {
    describe("getRoutes describe unit test...", function(){
    var request = require("request");
    test("GetRoutes Unit Test...", function(done){
    request(optionsForGetroutes, function (error, response, body) {
  if (error) throw new Error(error);
  
    //console.log("Response on getRoutes..."+JSON.stringify(JSON.parse(body)));
    var status = JSON.parse(body).status;
    expect(status).toBe(0);
    done();
  });
});
});
}

function getImage_test(req,res){
    describe("getImage describe unit test...", function(){
    var request = require("request");
    test("GetImage Unit Test..." , function(done){
    request(optionsForGetImage, function(error,response,body){
    //console.log("Response=="+JSON.stringify(response));
    expect(response.statusCode).toBe(200);
    done();
    });
    });
    });
}

function createTemplate_test(){
    jest.setTimeout(50000);
    test("createTemplate Unit Test.....", function(done){

   var result = openshiftSrc.createTemplate("test-demo",openshift.service_token,
   "ayush.ojha@Soprasteria.com","",function(response){
    //console.log("Response for createTemplate=="+JSON.stringify(response));
    expect(response.code).toBe(200);
    done();
    });
   
});
}

function callAPI_test(){
    describe("CallAPI Testing.....",function(){
    var jsonReply="";

    test("callAPI  Unit Test for GetAllProjects.....",function(done){
        let url = openshift.base_url + openshift.get_projects;
        OpenshiftAPI.callAPI('GET', url, openshift.service_token, "").then(function (templateResponse) {
            var projectJSON = JSON.parse(templateResponse);
            //console.log("callAPI_test Return==="+OpenshiftAPI.JSONParser(templateResponse));
            expect(OpenshiftAPI.JSONParser(templateResponse).length).toBeGreaterThan(0);
            done();
        }).catch(function (err) {
            console.log(err);
        });
    });

    test("callAPI Unit Test for Delete....",function(done){
        let url = openshift.base_url + "/oapi/v1/projects/" + 'test-demo';
        OpenshiftAPI.callAPI('DELETE', url, openshift.service_token, "").then(function (apiResponse) {
            //console.log('apiResponse ' + JSON.stringify(apiResponse));
            var projectJSON = JSON.parse(apiResponse);

            if (projectJSON.status == "Success" && projectJSON.code == 200) {
                jsonReply = { msg: "Project deleted successfully ", status: 1 };
            }
            else {
                jsonReply = { msg: "There is no such project", status: 0 };
            }
            //console.log("\nDelete Project API response \n" + JSON.stringify(jsonReply));
            if(jsonReply.status==1) {
            expect(jsonReply.status).toBe(1);
            done();
            }
            else {  //if(jsonReply.status ==0)
            expect(jsonReply.status).toBe(0);
            done();
            }
           /*  else{
                expect(jsonReply.status).equals(1);
                done();
            } */
            
        }).catch(function (err) {
            console.log(err);
        });
    });
});
}

/* function callDeployConfig_test(projectName, authToken, username, imageTags, callback){
    describe("callDeployConfig describe Test...", function(){
    test("callDeployConfig Unit Test...", function(done){
        openshiftSrc.callDeployConfig(projectName, authToken, username, imageTags, callback);
            done();
    });
    });
} */
