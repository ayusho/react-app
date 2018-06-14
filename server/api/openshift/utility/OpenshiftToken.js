// /**
//  * innerAuth authentication using Keycloak servers
//  * 
//  */
// var Q = require('q');
// // var cmd = require('node-cmd');

// var service = {};
// var authString = "";

// service.getSessionToken = getSessionToken;

// module.exports = service;

// function getSessionToken(userId, password,callback) {

//   console.log("getting openshift token");

//   var authString = "";

//   cmd.get(
//     'oc login -u=' + userId + ' -p=' + password, 
//     /**
//      * Login using OC command 
//      */
//     function (err, data, stderr) {
//       if (!err) {

//         console.log('Authentication status ', data);

//         cmd.get('oc whoami -t', function (err, sessionToken, stderr) {
//         /**
//         * Getting session token of logged in user
//         */
//           if (err) {
//             console.log("Problem while getting Session token of Openshift user")
//             callback('qSAhEU4VmqPhprja6tbH6TVlpYgOMue0DFoXskQ_SUA');
//           }
//           else {

//             authString = { authenticate: "true", sessionToken: true, status: 1 };
//             openshiftToken = sessionToken;
            
//             callback(openshiftToken.replace(/(\r\n\t|\n|\r\t)/gm, ""));
//             console.log('Openshift token ' + openshiftToken);
//           }
//         })
//       }
//       else {
//         console.log("Openshift authentication failed :(" + err);
//         callback('qSAhEU4VmqPhprja6tbH6TVlpYgOMue0DFoXskQ_SUA');
//       }
//     }
//   );
  
// }


