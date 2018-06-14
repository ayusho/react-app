var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var helmet = require('helmet');
var compression = require('compression');
var Keycloak = require('keycloak-connect');
var session = require('express-session');
var request = require('request');

var config = require('./config');

var userDetails = {};
//Set up default mongoose connection
var mongodb_user = process.env.MONGODB_USER || 'sopra';
var mongodb_password = process.env.MONGODB_PASSWORD || 'sopra';
var mongodb_db = process.env.MONGODB_DATABASE || 'NodeDB';
var mongodb_host = process.env.MONGODB_SERVICE_HOST || 'localhost';
var mongodb_port = process.env.MONGODB_SERVICE_PORT || '27017';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet()); //using helmet for protection against some well-known web vulnerabilities
app.use(compression()); // To compress the response of the body 


app.use('/api/db/validate', require('./server/api/dbservice/controllers/Validate'));
app.use('/api/db/instances', require('./server/api/dbservice/controllers/BotInstance'));
app.use('/api/openshift', require('./server/api/openshift/Openshift'));
app.use('/api/user/authentication', require('./server/api/innerauth/UserAuthentication'));

//  var mongoDb = process.env.DB_CONNECTION_STRING;

var mongoDb = 'mongodb://' + mongodb_user + ':' + mongodb_password + '@' + mongodb_host + ':' + mongodb_port + '/' + mongodb_db;

console.log('Connection string for mongo =>' + mongoDb);

mongoose.connect(mongoDb); // Connection with Mongo DB

process.on('unhandledRejection', error => {
    console.log('\n\n', error.message);
});

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    
    if (req.headers !== undefined && req.headers['x-forwarded-access-token'] !== undefined && req.headers['x-forwarded-user'] != undefined) {

        userDetails.accessToken = req.headers['x-forwarded-access-token'];
        userDetails.username = req.headers['x-forwarded-user'];
        // console.log(req.headers);
        console.log('Access Token --> ' + userDetails.accessToken + " Username --> " + userDetails.username);
        
    }
    res.render('dashboard', { accessToken: userDetails.accessToken, username: userDetails.username});
    
});


var port = process.env.NODE_ENV === 'production' ? 80 : 4000;

//var host = process.env.BACKEND_URL;
//const HOST = '0.0.0.0';
var server = app.listen(port/*,HOST*/, function () {
    console.log('Common Server is running on :  ' + port);
});