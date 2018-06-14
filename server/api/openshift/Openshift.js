
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
var mongoose = require('mongoose');
var gitlabAPI = require('../gitlab/gitlabAPI');

var openshift = require('./config');
var OpenshiftAPI = require('./functions');
var BotDetailSchema = require('../dbservice/models/BotDetailModel');

router.get('/project/routes', getRoutes);
router.get('/projects', getAllProjects);
router.get('/project/delete', deleteproject);
router.post('/project/create', createProject);
router.delete('/project/delete', deleteproject);
router.get('/project/getimage', getImage);
// router.get('/project/setimage', setImage);

router.get('./login');

var jsonReply = "";
var template = "";
var options = "";

module.exports = router;

var persVolObj = [
    { path: openshift.persistent_volume_logs_json, name: "persistent_volume_logs" },
    { path: openshift.persistent_volume_mongo_json, name: "persistent_volume_mongos" },
    { path: openshift.persistent_volume_udc_json, name: "persistent_volume_udc" },
    { path: openshift.persistent_volume_tdc_json, name: "persistent_volume_tdc" },
    { path: openshift.persistent_volume_algo, name: "persistent_volume_algo" }
];

var deployConfigObj = [
    { path: openshift.deploy_config_algo, name: "algo" },
    { path: openshift.deploy_config_backoffice, name: "backoffice-botify" },
    { path: openshift.deploy_config_server_chat, name: "serverchat-botify" },
    { path: openshift.deploy_config_frontend_json, name: "botify-frontend" },
    { path: openshift.deploy_config_backend_json, name: "botify-backend" },
    { path: openshift.deploy_config_mongo_db_json, name: "deploy_config_mongo_db" }
];

var serviceObj = [
    { path: openshift.service_front_end_json, name: "service_front_end" },
    { path: openshift.service_back_end_json, name: "service_back_end" },
    { path: openshift.service_backoffice, name: "service_backoffice" },
    { path: openshift.service_algo, name: "service_algo" },
    { path: openshift.service_server_chat, name: "service_server_chat" },
    { path: openshift.service_mongo_db_json, name: "service_mongo_db" },
];


var deployconfigs = [
    { depconfig: "serverchat-botify", dc_env_var: "API_URL", route_env_var: "serverchat-botify" },
    { depconfig: "backoffice-botify", dc_env_var: "BOTIFY_URL", route_env_var: "botify-frontend" },
    { depconfig: "botify-frontend", dc_env_var: "BOTIFY_BACKEND_HOST_PATH", route_env_var: "botify-backend" }
];

var routeObj = [
    { path: openshift.route_back_end_json, name: "route_back_end_json" },
    { path: openshift.route_front_end_json, name: "route_front_end_json" },
    { path: openshift.route_backoffice, name: "route_backoffice" },
    { path: openshift.route_server_chat, name: "route_server_chat" }
];


/**
 * Getting all the projects of user from Openshift
 * @param {*} req 
 * @param {*} res 
 */
function getAllProjects(req, res) {
    console.log('Getting OpnShift projects..');

    if (req.query !== undefined && req.query.token !== undefined && req.query.username !== undefined) {

        console.log('Username : ' + req.query.username);

        var authToken = req.query.token;

        let url = openshift.base_url + openshift.get_projects;

        OpenshiftAPI.callAPI('GET', url, authToken, "", function (templateResponse) {
            console.log('openshift ' + templateResponse);
            res.send(OpenshiftAPI.JSONParser(templateResponse));

            /*  var mongoData = OpenshiftAPI.JSONParser(templateResponse);
 
 
             for (let index = 0; index < mongoData.length; index++) {
                 console.log(mongoData[index].project_name + " " + mongoData[index].project_description);
 
                 BotDetailSchema.update(
                     {
                         project_name: mongoData[index].project_name,
                         project_description: mongoData[index].project_description,
                         username: req.query.username
                     },
                     {
                         $set: {
                             project_name: mongoData[index].project_name,
                             project_description: mongoData[index].project_description,
                             username: req.query.username
                         }
                     },
                     { upsert: true }, function (err, dbResult) {
                         if (err) {
                             console.error(err);
                             jsonReply = { msg: "Error", reason: err, status: -1 };
 
                         }
                         else {
                             console.log('db --> ' + dbResult);
                             jsonReply = { msg: "Updated", status: 1 };
 
                         }
                     }); 
 
 
             }*/
        })

    }
    else {
        jsonReply = { msg: "Invalid/missing parameters", status: 0 };
        console.log(JSON.stringify(jsonReply));
        res.send(jsonReply);
    }
}
/**
 * Delete project on Openshift
 * @param {*} req 
 * @param {*} res 
 */
function deleteproject(req, res) {

    console.log('\nDeleting Project ...\n');

    if (req.body !== undefined && req.body.project_name !== undefined && req.body.token !== undefined) {

        var projectName = req.body.project_name;
        var authToken = req.body.token;
        console.log(projectName + " " + authToken);
        let url = openshift.base_url + "/oapi/v1/projects/" + projectName;

        OpenshiftAPI.callAPI('DELETE', url, openshift.service_token, "", function (apiResponse) {
            console.log('apiResponse ' + JSON.stringify(apiResponse, null, 2));
            var projectJSON = JSON.parse(apiResponse);

            if (projectJSON.status == "Success" && projectJSON.code == 200) {
                jsonReply = { msg: "Project deleted successfully ", status: 1 };
            }
            else {
                jsonReply = { msg: "There is no such project", status: 0 };
            }

            console.log("\nDelete Project API response \n" + jsonReply.msg);
            res.send(jsonReply);
        })
    }
    else {
        jsonReply = { msg: "missing/invalid parameters", status: -1 }
        res.json(jsonReply);
    }
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Create project on Openshift 
 */
function createProject(req, res) {

    console.log('\nCreating new project ...\n');

    if (req.body !== undefined && req.body.project_name !== undefined && req.body.display_name !== undefined && req.body.project_description !== undefined && req.body.token !== undefined && req.body.username !== undefined) {

        let projectName = req.body.project_name;
        let displayName = req.body.display_name;
        let projectDescription = req.body.project_description;
        // let authToken = req.body.token;
        let username = req.body.username;
        let imageTags = "";

        if (req.body.image_tag !== undefined) {
            imageTags = JSON.parse(req.body['image_tag']);
            console.log(JSON.stringify(imageTags, null, 2));
            console.log("Tag name ==>" + imageTags[0].tag_name);
        }

        // console.log(projectName + " " + displayName + " " + projectDescription + " " + openshift.service_token + " " + username + " " + imageTags);

        var options = {
            method: 'POST',
            url: openshift.base_url + openshift.create_project,
            headers:
            {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + openshift.service_token
            },
            body:
            {
                apiVersion: 'v1',
                kind: 'ProjectRequest',
                metadata: { name: projectName },
                displayName: displayName,
                description: projectDescription
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) { console.log('Error ' + error); }
            else {
                console.log('res ' + body);
                var projectJSON = body;

                /*   if (body.replace(/^\s+|\s+$/g, '') == 'Unauthorized') {
                      console.log('Token might be invalid');
                  } */
                if (projectJSON.status !== undefined) {

                    console.log('status ' + projectJSON.status);
                }

                if (projectJSON.code !== undefined && projectJSON.code == 409) {
                    jsonReply = { msg: "Project already exist ", status: 0 };
                    console.log("\nCreate Project API response \n" + jsonReply);

                    var response = createTemplate(projectName, openshift.service_token, username, imageTags, function (message) {
                        res.send(message);
                    }); // Calling Create Template API
                }

                else {

                    jsonReply = { msg: "New Project created", status: 1 };
                    console.log("\nCreate Project API response \n" + jsonReply);

                    var response = createTemplate(projectName, openshift.service_token, username, imageTags, function (message) {
                        res.send(message);
                    }); // Calling Create Template API

                }

            }
        });
    }
    else {
        jsonReply = { msg: "missing/invalid parameters", status: 0 };
        res.send(jsonReply);
        console.error("missing/invalid parameters");
    }

}

/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} username 
 * @param {*} callback 
 */
function createTemplate(projectName, authToken, username, imageTags, callback) {

    console.log('creating template API started..');
    jsonReply = "";

    try {
        template = fs.readFileSync(__dirname + openshift.template);
    }
    catch (err) {
        console.error(err);
    }
    options = {
        method: 'POST',
        url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/templates",
        headers:
        {
            authorization: 'Bearer ' + authToken,
            'content-type': 'application/yaml'
        },
        body: template.toString()
    };

    request(options, function (error, response, body) {
        if (error) {
            console.error(error);
            jsonReply = { status: "incomplete", code: 202 };
            callback(jsonReply);
        }
        else {

            var templateResponse = JSON.parse(body);

            if (templateResponse.code == 409 && templateResponse.status == "Failure") {

                jsonReply = { msg: "Template already exists for the given project", status: 0 };
                console.log("Template already exists");
                try {
                    addRoles(projectName, authToken, username, imageTags, callback);
                }
                catch (err) {
                    console.error(err);
                }

            }
            else if (templateResponse.kind == "Template" && templateResponse.metadata.name !== undefined) {

                jsonReply = { msg: "New Template Created", status: 1 };
                console.log("New Template Created");
                try {
                    addRoles(projectName, authToken, username, imageTags, callback);
                }
                catch (err) {
                    console.error(err);
                }
            }
            else {
                jsonReply = { status: "Incomplete while calling create template api", code: -1 };
                callback(jsonReply);
                console.error("Something went wrong while calling create template api");
            }
        }
    });

}

/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} username 
 * @param {*} callback 
 */
function addRoles(projectName, authToken, username, imageTags, callback) {

    console.log('Role binding started ...');

    var options = {
        method: 'POST',
        url: openshift.base_url + '/oapi/v1/namespaces/' + projectName + '/rolebindings',
        headers:
        {
            'content-type': 'application/json',
            authorization: 'Bearer ' + authToken
        },
        body:
        {
            kind: 'RoleBinding',
            apiVersion: 'v1',
            metadata: { name: 'ViewProject', namespace: projectName },
            roleRef: { name: 'admin' },
            subjects: [{ name: username, kind: 'User' }]
        },
        json: true
    };

    request(options, function (error, response, body) {

        if (error) {
            console.error(error);
            jsonReply = { status: "incomplete", code: 202 };
            callback(jsonReply);
        }

        let jsonResponse = body;

        if (jsonResponse.code !== 'undefined' && jsonResponse.code == 409) {
            console.log('Role binding already exists.');
            try {
                createSecret(projectName, authToken, username, imageTags, callback);
            }
            catch (err) {
                console.error(err);
            }
        }
        else if (jsonResponse.kind == "RoleBinding" && jsonResponse.kind !== undefined) {

            console.log('Role binding done.');

            try {
                createSecret(projectName, authToken, username, imageTags, callback);
            }
            catch (err) {
                console.error(err);
            }
        }
        else if (jsonResponse.code == 422) {
            console.log('Bad request for role binding.');
        }
        else {
            console.log('Something happend bad with role binding api.');
        }
        console.log(body);
    });


}

function createbranch(projectName, authToken, username, callback) {

    gitlabAPI.createBranch('node-test', function (apiResponse) {
        console.log('api response ' + apiResponse);

    });
}

/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} username 
 * @param {*} callback 
 */
function createSecret(projectName, authToken, username, imageTags, callback) {

    console.log('\nCalling create Secret API\n');

    let jsonResponse = "";
    let jsonReply = "";
    try {
        var secretJson = fs.readFileSync(__dirname + openshift.secret_json);
    }
    catch (err) {
        console.error(err);
    }
    options = {
        method: 'POST',
        url: openshift.base_url + "/api/v1/namespaces/" + projectName + "/secrets",
        headers:
        {
            authorization: 'Bearer ' + authToken,
            'content-type': 'application/json'
        },
        body: secretJson.toString()
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log('\nError while creating secret api \n' + error);
            jsonReply = { status: "incomplete", code: 202 };
            callback(jsonReply);
        }
        else {

            jsonResponse = JSON.parse(body);

            if (jsonResponse.kind == "Secret" && jsonResponse.metadata.name !== undefined) {

                jsonReply = { msg: "New Secret created", status: 1 }

                console.log("New Secret created ☺");
                try {
                    callPVC(projectName, authToken, username, imageTags, callback);
                }
                catch (err) {
                    console.error(err);
                }

            }
            else if (jsonResponse.kind == "Status" && jsonResponse.code == 409) {

                console.log("\nSecret Already exists for the given project\n");
                try {
                    callPVC(projectName, authToken, username, imageTags, callback);
                }
                catch (err) {
                    console.error(err);
                }
            }
            else {
                console.log("Something went wrong while creating secret " + error);


            }
        }

    });

}

/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} username 
 * @param {*} callback 
 */
function callPVC(projectName, authToken, username, imageTags, callback) {

    console.log('\nCall persistent volume claim started ..\n');

    let jsonResponse = "";

    for (let persIndex = 0; persIndex < persVolObj.length; persIndex++) {

        try {
            var pvcJson = fs.readFileSync(__dirname + persVolObj[persIndex].path);
        }
        catch (err) {
            console.error(err);
        }
        options = {
            method: 'POST',
            url: openshift.base_url + "/api/v1/namespaces/" + projectName + "/persistentvolumeclaims",
            headers:
            {
                authorization: 'Bearer ' + authToken,
                'content-type': 'application/json'
            },
            body: pvcJson.toString()
        };

        request(options, function (error, response, body) {
            if (error) {
                console.error(error);
                jsonReply = { status: "incomplete due to " + persVolObj[persIndex].name, code: 202 };
                callback(jsonReply);
            }
            else {

                jsonResponse = JSON.parse(body);
                console.log(jsonResponse.status);

                if (jsonResponse.status == "Failure" && jsonResponse.code == 400) {
                    console.log("Bad request/invalid input body while " + persVolObj[persIndex].name);
                }
                if (jsonResponse.kind == "PersistentVolumeClaim" && jsonResponse.metadata.name !== undefined) {
                    console.log("Logs claim " + persVolObj[persIndex].name + "  successfully called ☺");

                }
                if (jsonResponse.code == 409) {

                    console.log("Already " + persVolObj[persIndex].name + " exists");
                }
                if (persVolObj[persIndex].name == "persistent_volume_algo") {
                    try {
                        callDeployConfig(projectName, authToken, username, imageTags, callback);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
        });
    }
}

/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} username 
 * @param {*} callback 
 */
function callDeployConfig(projectName, authToken, username, imageTags, callback) {

    console.log('\nCall deploy config  started ..\n');

    if (imageTags !== "") {

        var deployConfigJson = "";
        console.log('imageTags ' + JSON.stringify(imageTags, null, 2));
        for (let configIndex = 0; configIndex < imageTags.length; configIndex++) {
            try {
                deployConfigJson = fs.readFileSync(__dirname + deployConfigObj[configIndex].path);
                console.log('Image tags length ' + deployConfigObj.length + "\t" + imageTags.length);
                // for (let imageIndex = 0; imageIndex < imageTags.length; imageIndex++) {
                if (deployConfigObj[configIndex].name == imageTags[configIndex].dc_name) {

                    console.log('Ready to update the json to create deployment config');
                    console.log('Matched ' + deployConfigObj[configIndex].name + "\t" + imageTags[configIndex].dc_name);
                    parsedJSON = JSON.parse(deployConfigJson);
                    console.log('Tag name--' + imageTags[configIndex].tag_name);

                    for (let triggerIndex = 0; triggerIndex < parsedJSON.spec.triggers.length; triggerIndex++) {
                        if (parsedJSON.spec.triggers[triggerIndex].hasOwnProperty('imageChangeParams')) {
                            console.log('Image params found ☺');
                            var tempImage = parsedJSON.spec.triggers[triggerIndex].imageChangeParams.from.name.split(":");
                            tempImage = tempImage[0] + ':' + imageTags[configIndex].tag_name;
                            console.log('temp image ' + tempImage);
                            parsedJSON.spec.triggers[triggerIndex].imageChangeParams.from.name = tempImage;
                            deployConfigJson = JSON.stringify(parsedJSON);
                        }
                        else {
                            console.log('Image params not found');
                        }
                    }
                }
                options = {
                    method: 'POST',
                    url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/deploymentconfigs",
                    headers:
                    {
                        authorization: 'Bearer ' + authToken,
                        'content-type': 'application/json'
                    },
                    body: deployConfigJson.toString()
                };

                request(options, function (error, response, body) {
                    if (error) {
                        console.error(error);
                        jsonReply = { status: "incomplete due to " + deployConfigObj[configIndex].name, code: 202 };
                        callback(jsonReply);
                    }
                    else {

                        let jsonResponse = JSON.parse(body);
                        console.log(jsonResponse.status);

                        if (jsonResponse.status == "Failure" && jsonResponse.code == 400) {
                            console.log("Bad request/invalid input body :( in " + deployConfigObj[configIndex].name);

                        }
                        if (jsonResponse.code == 409 && jsonResponse.code !== undefined) {

                            console.log(deployConfigObj[configIndex].name + ' already exists');

                        }
                        if (jsonResponse.kind == "DeploymentConfig" && jsonResponse.metadata.name !== undefined) {
                            console.log("Deploy config " + deployConfigObj[configIndex].name + "sucessfully called");
                        }
                        if (deployConfigObj[configIndex].name == "deploy_config_mongo_db") {
                            try {
                                callService(projectName, authToken, username, imageTags, callback);
                            }
                            catch (err) {
                                console.error(err);
                            }
                        }
                    }
                });
                // }
            }

            catch (err) {
                console.error(err);
            }
            // console.log('deployConfigJson' + deployConfigJson);

        }
        deployConfigJson1 = fs.readFileSync(__dirname + openshift.deploy_config_mongo_db_json);
        options = {
            method: 'POST',
            url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/deploymentconfigs",
            headers:
            {
                authorization: 'Bearer ' + authToken,
                'content-type': 'application/json'
            },
            body: deployConfigJson.toString()
        };

        request(options, function (error, response, body) {
            if (error) {
                console.error(error);
                jsonReply = { status: "incomplete ", code: 202 };
                callback(jsonReply);
            }
            else {

                let jsonResponse = JSON.parse(body);
                console.log(jsonResponse.status);

                if (jsonResponse.status == "Failure" && jsonResponse.code == 400) {
                    console.log("Bad request/invalid input body :( in Mongo DB deploy config");

                }
                if (jsonResponse.code == 409 && jsonResponse.code !== undefined) {

                    console.log('Mongo DB deploy config already exists');
                    try {
                        callService(projectName, authToken, username, imageTags, callback);
                    }
                    catch (err) {
                        console.error(err);
                    }

                }
                if (jsonResponse.kind == "DeploymentConfig" && jsonResponse.metadata.name !== undefined) {
                    console.log("Deploy config " + deployConfigObj[configIndex].name + "sucessfully called");
                }
                if (deployConfigObj[configIndex].name == "deploy_config_server_chat") {
                    try {
                        callService(projectName, authToken, username, callback);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }



            }
        });
    }
    else {
        console.log('else executes');

        for (let configIndex = 0; configIndex < deployConfigObj.length; configIndex++) {

            try {
                var deployConfigJson = fs.readFileSync(__dirname + deployConfigObj[configIndex].path);
            }
            catch (err) {
                console.error(err);
            }
            options = {
                method: 'POST',
                url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/deploymentconfigs",
                headers:
                {
                    authorization: 'Bearer ' + authToken,
                    'content-type': 'application/json'
                },
                body: deployConfigJson.toString()
            };

            request(options, function (error, response, body) {
                if (error) {
                    console.error(error);
                    jsonReply = { status: "incomplete due to " + deployConfigObj[configIndex].name, code: 202 };
                    callback(jsonReply);
                }
                else {

                    let jsonResponse = JSON.parse(body);
                    console.log(jsonResponse.status);

                    if (jsonResponse.status == "Failure" && jsonResponse.code == 400) {
                        console.log("Bad request/invalid input body :( in " + deployConfigObj[configIndex].name);

                    }
                    if (jsonResponse.code == 409 && jsonResponse.code !== undefined) {

                        console.log(deployConfigObj[configIndex].name + ' already exists');

                    }
                    if (jsonResponse.kind == "DeploymentConfig" && jsonResponse.metadata.name !== undefined) {
                        console.log("Deploy config " + deployConfigObj[configIndex].name + "sucessfully called");
                    }
                    if (deployConfigObj[configIndex].name == "deploy_config_mongo_db") {
                        try {
                            callService(projectName, authToken, username, imageTags, callback);
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }
                }
            });
        }

    }

}

/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} username 
 * @param {*} callback 
 */
function callService(projectName, authToken, username, imageTags, callback) {

    console.log('Call service started ..');

    for (let serviceIndex = 0; serviceIndex < serviceObj.length; serviceIndex++) {
        try {
            var serviceJson = fs.readFileSync(__dirname + serviceObj[serviceIndex].path);
        }
        catch (err) {
            console.error(err);
        }
        options = {
            method: 'POST',
            url: openshift.base_url + "/api/v1/namespaces/" + projectName + "/services",
            headers:
            {
                authorization: 'Bearer ' + authToken,
                'content-type': 'application/json'
            },
            body: serviceJson.toString()
        };

        request(options, function (error, response, body) {
            if (error) {
                console.error(error);
                jsonReply = { status: "incomplete due to " + serviceObj[serviceIndex].name, code: 202 };
                callback(jsonReply);
            }
            else {

                let jsonResponse = JSON.parse(body);
                console.log(jsonResponse.status);

                if (jsonResponse.status == "Failure" && jsonResponse.code == 400) {
                    console.log("Bad request/invalid input body :( in " + serviceObj[serviceIndex].name);

                }
                if (jsonResponse.code == 409 && jsonResponse.code == 409 !== undefined) {

                    console.log(serviceObj[serviceIndex].name + ' already exists');

                }
                if (jsonResponse.kind == "Service" && jsonResponse.metadata.name !== undefined) {

                    console.log("\nService " + serviceObj[serviceIndex].name + " sucessfully called\n");

                }
                if (serviceObj[serviceIndex].name == "service_server_chat") {
                    try {
                        callRoute(projectName, authToken, username, imageTags, callback);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
        });
    }

}


/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} username 
 * @param {*} callback 
 */
function callRoute(projectName, authToken, username, imageTags, callback) {

    console.log('\nCall route started ..\n');

    for (let routeIndex = 0; routeIndex < routeObj.length; routeIndex++) {

        try {
            var routeJson = fs.readFileSync(__dirname + routeObj[routeIndex].path);
        }
        catch (err) {
            console.error(err);
        }

        options = {
            method: 'POST',
            url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/routes",
            headers:
            {
                authorization: 'Bearer ' + authToken,
                'content-type': 'application/json'
            },
            body: routeJson.toString()
        };

        request(options, function (error, response, body) {
            if (error) {
                console.error(error);
                jsonReply = { status: "incomplete due to " + routeObj[routeIndex].name, code: 202 };
                callback(jsonReply);
            }
            else {

                let jsonResponse = JSON.parse(body);

                if (jsonResponse.status == "Failure" && jsonResponse.code == 400) {
                    console.log("Bad request/invalid input body :( in " + routeObj[routeIndex].name);

                }
                if (jsonResponse.code == 409 && jsonResponse.code == 409 !== undefined) {
                    console.log(routeObj[routeIndex].name + 'already exists');


                }
                if (jsonResponse.kind == "Route" && jsonResponse.metadata.name !== undefined) {
                    console.log("\n" + routeObj[routeIndex].name + " sucessfully called\n");
                }
                if (routeObj[routeIndex].name == "route_server_chat") {
                    try {
                        updateDeployConfig(projectName, authToken, username, imageTags, callback);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
        });
    }
}

function setimageTags(projectName, authToken, username, imageTags, callback) {

    for (let index = 0; index < imageTags.length; index++) {
        OpenshiftAPI.getDeployConfigFD(projectName, authToken, imageTags[index], function (modifiedJson) {
            // console.log('Json modified.' + JSON.stringify(modifiedJson, null, 2));

            options = {

                method: 'PUT',
                url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/deploymentconfigs/" + imageTags[index].dc_name,
                headers:
                {
                    Authorization: 'Bearer ' + openshift.service_token
                },
                body: JSON.stringify(modifiedJson)
            };

            request(options, function (error, response, body) {
                if (error) {
                    console.error(error);
                    jsonReply = { status: "incomplete ", code: 202 };
                    callback(jsonReply);
                }
                else {
                    console.log('updation done.');
                    if (index == imageTags.length - 1) {
                        //res.send('Updation done');
                        try {
                            updateDeployConfig(projectName, authToken, username, imageTags, callback);
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }
                }
            });
        });
    }
}

function updateDeployConfig(projectName, authToken, username, imageTags, callback) {

    console.log('\nCalling update deploy config  started ..\n');
    jsonReply = "";

    for (let configIndex = 0; configIndex < deployconfigs.length; configIndex++) {

        OpenshiftAPI.getDeployConfig(projectName, authToken, deployconfigs[configIndex], function (deployConfigJSON) {
            var options = {
                method: 'PUT',
                url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/deploymentconfigs/" + deployconfigs[configIndex].depconfig,
                headers:
                {
                    Authorization: 'Bearer ' + authToken
                },
                body: JSON.stringify(deployConfigJSON)
            };

            request(options, function (error, response, body) {
                if (error) {
                    console.error(error);
                    jsonReply = { status: "incomplete due to " + deployconfigs[configIndex].depconfig, code: 202 };
                    callback(jsonReply);
                }
                else {

                    console.log('updation in ' + deployconfigs[configIndex].depconfig + ' done.');

                }
            });

        });
    }
    jsonReply = { status: "complete", code: 200 };
    callback(jsonReply);
}


function getImage(req, res) {

    console.log('Getting images started..');

    var imageStreamObj = [
        { imageName: 'botify-kit' },
        { imageName: 'botifykit-build' }
    ];
    let authToken = req.query.token;
    console.log('Token while getting image ' + authToken);
    OpenshiftAPI.tagsParser(imageStreamObj, authToken, function (response) {
        // console.log('tagsparser() response' + JSON.stringify(response));
        res.send(response);
    });

}
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function getRoutes(req, res) {

    console.log('\nGetting routes ...\n')

    if (req.query !== undefined && req.query.project_name && req.query.token !== undefined) {

        var projectName = req.query.project_name;
        var authToken = req.query.token;

        console.log('project name ')
        options = {
            method: 'GET',
            url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/routes",
            headers:
            {
                Authorization: 'Bearer ' + openshift.service_token
            }

        };

        request(options, function (error, response, body) {

            if (error) {
                console.error(error);
                jsonReply = { msg: "Something went wrong while calling get route api", status: -1 };
                res.send(jsonReply);
            }
            else {
                console.log("\nRoutes ==> \n" + body);
                jsonResponse = JSON.parse(body);

                if (jsonResponse.items !== "" && jsonResponse.items.length > 0) {

                    for (let index = 0; index < jsonResponse.items.length; index++) {

                        console.log('for getRoutes() name -->' + jsonResponse.items[index].metadata.name);

                        if (jsonResponse.items[index].metadata.name == "backoffice-botify") {

                            if (jsonResponse.items[index].spec.host !== undefined && jsonResponse.items[index].spec.host !== "") {

                                let hostName = jsonResponse.items[index].spec.host;
                                let jsonReplyRoute = { host: hostName, status: 1 };

                                console.log('jsonReployRoute getRoutes() ' + JSON.stringify(jsonReplyRoute));
                                res.send(jsonReplyRoute);
                            }
                        }
                        else {
                            console.log('backoffice-botify does not exist');
                        }
                    }
                }
                else {
                    jsonReply = { msg: "No project available", status: 0 };
                    res.send(jsonReply);

                }
            }
        });
    }
    else {
        console.log('invalid/missing parameters');
        jsonReply = { msg: "invalid/missing parameters", status: -1 };
        res.send(jsonReply);
    }
}