var service = {};
var request = require('request');
var Q = require('q');

var openshift = require('./config');

service.callAPI = callAPI;
service.JSONParser = JSONParser;
service.getDeployConfig = getDeployConfig;
service.tagsParser = tagsParser;
service.getDeployConfigFD = getDeployConfigFD;

var deprepo = {
    "backoffice-botify": "backoffice",
    "algo": "algo",
    "serverchat-botify": "serverchat",
    "botify-frontend": "botify-build-frontend",
    "botify-backend": "botify-build-backend"
};

var imageStreamObj = [
    { imageName: 'botify-kit' },
    { imageName: 'botifykit-build' }
];

var deferred = Q.defer();

module.exports = service;

/**
 * 
 * @param {*} methodType 
 * @param {*} apiURL 
 * @param {*} authToken 
 * @param {*} json 
 * Openshift Rest api calling
 */
function callAPI(methodType, apiURL, authToken, json, callback) {

    if (methodType !== "" && apiURL !== "" && authToken !== "") {

        console.log(methodType + " " + apiURL + " " + authToken);

        options = {
            method: methodType,
            url: apiURL,
            headers:
            {
                authorization: 'Bearer ' + authToken,
                'content-type': 'application/json'
            },
        };
        request(options, function (error, response, body) {
            if (error) {
                console.log('Error while calling API ' + error);
                // deferred.reject(error);
                callback(error);
            }
            else {
                if (body.replace(/^\s+|\s+$/g, '') == 'Unauthorized') {
                    console.log('Token might be invalid');
                }
                callback(body);
            }
        });
    }
    else {
        console.error('Parameters might be null');
    }
}	
/**
 * 
 * @param {*} projectJSONResponse 
 * Json parsing for getAll openshift projects
 */

function JSONParser(projectJSONResponse) {


    let projectJSON = "";
    let projectDetailArray = "";
    let index = "";
    let parsedJSONArray = [];
    let project_name = "";
    let creation_time = "";
    let project_description = "";

    console.log('parsing started ..');

    if (projectJSONResponse != "" && projectJSONResponse != undefined) {

        projectJSON = JSON.parse(projectJSONResponse);
        projectDetailArray = projectJSON.items;

        // console.log(projectDetailArray[0].metadata.annotations["openshift.io/description"]);

        for (index = 0; index < projectDetailArray.length; index++) {

            project_name = projectDetailArray[index].metadata.name;
            creation_time = projectDetailArray[index].metadata.creationTimestamp.replace('T', ' ').substr(0, 19);
            project_description = projectDetailArray[index].metadata.annotations["openshift.io/description"];

            parsedJSONArray.push(buildSaveChatData(project_name, project_description, timeConverter(creation_time)));

            // console.log('creation_time-' + timeConverter(creation_time));


        }
        // console.log('array ' + parsedJSONArray);
        console.log('parsing done');
    }
    else {
        console.log("Unable to do parsing as JSON body is null");
    }
    return parsedJSONArray;
}

/**
 * 
 * @param {*} date
 * Converting date format while displaying all projects 
 */
function timeConverter(date) {

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    date = date.replace(/-/g, '/');
    var d = new Date(date);

    var hour = d.getHours();

    return d.getFullYear() + ' ' + months[d.getMonth()] + ' ' + d.getDate() + '     ' + (hour % 12) + ':' + d.getMinutes() + ' ' + (hour > 11 ? 'pm' : 'am');
}

function chatObject(project_name, project_description, creation_time) {

    this.project_name = project_name;
    this.creation_time = creation_time;
    this.project_description = project_description;
}

function buildSaveChatData(project_name, project_description, creation_time) {
    return new chatObject(project_name, project_description, creation_time);
}

/**
 * Getting deploy config ,called by updatedeployconfig()
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} depconf 
 * @param {*} callback 
 */
function getDeployConfig(projectName, authToken, depconf, callback) {

    console.log('env name ==> ' + depconf.depconfig);

    let env_value = "";
    var options = {
        method: 'GET',
        url: openshift.base_url + '/oapi/v1/namespaces/' + projectName + '/deploymentconfigs/' + depconf.depconfig,
        headers:
        {
            Authorization: 'Bearer ' + authToken
        }
    };

    request(options, function (error, response, body) {
        if (error) { console.error(error); }
        else {
            var parsedJSON = JSON.parse(body);

            if (parsedJSON.spec !== undefined && parsedJSON.spec !== "") {

                let spec = parsedJSON.spec.template.spec;
                for (let index1 = 0; index1 < spec.containers.length; index1++) {
                    if (spec.containers[index1].env.length > 0 && spec.containers[index1].env !== undefined) {

                        getRoute(projectName, authToken, depconf, function (route) {

                            if (route.status !== "") {
                                let route_url = route.host;
                                console.log('route.host ' + route.host);

                                for (let index2 = 0; index2 < spec.containers[index1].env.length; index2++) {
                                    // console.log('for ==> ' + spec.containers[index1].env[index2].name);
                                    if (spec.containers[index1].env[index2].name === depconf.dc_env_var) {
                                        console.log('got botify url');
                                        spec.containers[index1].env[index2].value = route_url;
                                        callback(parsedJSON);
                                    }
                                }
                            }
                            else {
                                console.log('Something went wrong with route url in ' + depconf.dc_env_var);
                            }
                        });

                    }
                }
            }
        }
    });
}

/**
 * 
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} depconf 
 * @param {*} callback 
 */
function getRoute(projectName, authToken, depconf, callback) {

    jsonReply = "";

    options = {
        method: 'GET',
        url: openshift.base_url + "/oapi/v1/namespaces/" + projectName + "/routes",
        headers:
        {
            Authorization: 'Bearer ' + authToken
        }
    };

    request(options, function (error, response, body) {

        if (error) {
            console.error(error);
            jsonReply = { msg: "Something went wrong while updating " + depconf.depconfig, status: -1 };
            callback(jsonReply);
        }
        else {

            jsonResponse = JSON.parse(body);

            if (jsonResponse.items !== "" && jsonResponse.items.length > 0) {

                for (let index = 0; index < jsonResponse.items.length; index++) {

                    if (jsonResponse.items[index].metadata != undefined && jsonResponse.items[index].metadata.name == depconf.route_env_var) {

                        if (jsonResponse.items[index].spec.host !== undefined && jsonResponse.items[index].spec.host !== "") {
                            console.log('enviroment variable --> ' + depconf.route_env_var);
                            if (depconf.route_env_var === "serverchat-botify") {
                                console.log('inside server chat botify');
                                hostName = "'http://" + jsonResponse.items[index].spec.host + "'";
                            }
                            else {
                                hostName = "http://" + jsonResponse.items[index].spec.host;
                            }
                        }
                        let json = { host: hostName, status: 1 };

                        callback(json);
                    }
                }
            }
            else {
                jsonReply = { msg: "No project available", status: 0 };

                callback(jsonReply);

            }
        }
    });

}

/**
 * Getting deploy config for different deploy config
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} json 
 * @param {*} callback 
 */
function getDeployConfigFD(projectName, authToken, json, callback) {

    console.log('Json ' + json + "  " + json.dc_name + " == " + json.tag_name);

    var options = {
        method: 'GET',
        url: openshift.base_url + '/oapi/v1/namespaces/' + projectName + '/deploymentconfigs/' + json.dc_name,
        headers:
        {
            Authorization: 'Bearer ' + authToken
        }
    };
    var imageName = "";
    var splitImageName = "";
    let spec = "";
    request(options, function (error, response, body) {
        if (error) { console.error(error); }
        else {
            // console.log('body');
            var parsedJSON = JSON.parse(body);

            if (parsedJSON.spec !== undefined || parsedJSON.spec !== "") {
                getRegistryRepo(authToken, json, function (registryPath) {
                    for (let regisIndex = 0; regisIndex < registryPath.length; regisIndex++) {
                        console.log('regis path ' + JSON.stringify(registryPath, null, 2));
                        imageName = parsedJSON.spec.triggers[0].imageChangeParams.from.name;
                        splitImageName = imageName.split(":");
                        console.log('Formatted string ==> \n\n' + splitImageName[0] + "\n\n" + splitImageName[1]);
                        parsedJSON.spec.triggers[0].imageChangeParams.from.name = splitImageName[0] + ":" + json.tag_name;
                        console.log('image change status ==> ' + JSON.stringify(parsedJSON, null, 2));

                        spec = parsedJSON.spec.template.spec;
                        for (let index1 = 0; index1 < spec.containers.length; index1++) {
                            console.log('docker image path ==> ' + spec.containers[index1].image);
                            spec.containers[index1].image = registryPath[regisIndex].path;

                        }
                    }
                    callback(parsedJSON);
                });
            }
        }
    });
}

/**
 * Getting docker repositories
 * @param {*} projectName 
 * @param {*} authToken 
 * @param {*} json 
 * @param {*} callback 
 */
function getRegistryRepo(authToken, json, callback) {
    console.log('Get docker registry started ..');
    let dockerImageRepo = "";
    let dockerImgArray = [];
    let dc_name = json.dc_name;
    let repository_name = deprepo[dc_name];
    console.log('Repstry name ' + repository_name);

    // projectName = "botify-kit";
    for (let imageIndex = 0; imageIndex < imageStreamObj.length; imageIndex++) {
        options = {
            method: 'GET',
            url: openshift.base_url + '/oapi/v1/namespaces/' + imageStreamObj[imageIndex].imageName + '/imagestreams',
            headers:
            {
                'content-type': 'application/json-patch+json',
                authorization: 'Bearer ' + authToken
            },
            body: '{\r\n  "op": "add",\r\n  "path": "/metadata/annotations",\r\n  "value": {"openshift.io/node-selector": "servicelevel=botifyproject"}\r\n}'
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
            }
            // console.log(body);

            let parsedJson = JSON.parse(body);

            if (parsedJson.items !== "" && parsedJson.items !== undefined) {
                let items = parsedJson.items;
                for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                    for (let tagIndex = 0; tagIndex < items[itemIndex].status.tags.length; tagIndex++) {
                        // console.log(items[itemIndex].metadata.name + " <===> " + items[itemIndex].status.tags[tagIndex].tag);
                        if (items[itemIndex].metadata.name === repository_name && items[itemIndex].status.tags[tagIndex].tag === json.tag_name) {
                            console.log('docker registry --> ');
                            dockerImageRepo = items[itemIndex].status.tags[tagIndex].items[0].dockerImageReference;
                            var formattedString = dockerImageRepo.split("@");
                            var registeryString = formattedString[0] + ":latest";

                            dockerImgArray.push(buildjSONData1(repository_name, registeryString));
                        }
                    }
                }
            }
            if (imageStreamObj[imageIndex].imageName === "botify-kit") {
                if (dockerImgArray !== "") {
                    // console.log('Registry array ' + dockerImgArray);
                    callback(dockerImgArray);
                    dockerImgArray = [];
                }
                else {
                    console.log('Docker image array might be null');
                }
            }
        });
    }
}
/**
 * Parsing tags from image stream json
 * @param {*} imageStreamObj 
 * @param {*} callback 
 */
function tagsParser(imageStreamObj, authToken, callback) {

    console.log('parsed json for imagestream');

    var JsonArray1 = [];
    var JsonArray2 = [];

    for (let imageIndex = 0; imageIndex < imageStreamObj.length; imageIndex++) {

        options = {
            method: 'GET',
            url: openshift.base_url + '/oapi/v1/namespaces/' + imageStreamObj[imageIndex].imageName + '/imagestreams',
            headers:
            {
                'content-type': 'application/json-patch+json',
                authorization: 'Bearer ' + authToken
            },
            body: '{\r\n  "op": "add",\r\n  "path": "/metadata/annotations",\r\n  "value": {"openshift.io/node-selector": "servicelevel=botifyproject"}\r\n}'
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
            }
            // console.log(body);

            let parsedJson = JSON.parse(body);

            if (body.replace(/^\s+|\s+$/g, '') == 'Unauthorized') {
                console.log('Token might be invalid');
            }
            if (parsedJson.kind === "ImageStreamList") {
                console.log('Sucessfully called');

                let items = parsedJson.items;
                for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                    for (let tagIndex = 0; tagIndex < items[itemIndex].status.tags.length; tagIndex++) {
                        JsonArray1.push(buildJsonDataImage(items[itemIndex].status.tags[tagIndex].tag));
                    }
                    JsonArray2.push(buildJsonData(items[itemIndex].metadata.name, JsonArray1));
                    JsonArray1 = [];
                }
            }
            if (imageStreamObj[imageIndex].imageName === "botify-kit") {
                console.log('botify-kit');
                // console.log('inside ===> ' + JSON.stringify(JsonArray2, null, 2));
                callback(JsonArray2);
            }
        });
    }
}

function jsonObject(image_name, tags) {

    this.image_name = image_name;
    this.tags = tags;
}

function buildJsonData(image, tags) {
    return new jsonObject(image, tags);
}

function jsonObject1(repo, path) {

    this.repo = repo;
    this.path = path;
}

function buildjSONData1(repo, path) {
    return new jsonObject1(repo, path);
}

function jsonObjectImage(name) {
    this.name = name;
}

function buildJsonDataImage(name) {
    return new jsonObjectImage(name);
}
