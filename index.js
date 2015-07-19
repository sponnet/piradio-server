var util = require('util');
var Firebase = require("firebase");
var fs = require('fs');
var express = require('express');
var app = express();

// load the plugins

var plugins_joefm = require('./fetchers/joefm');
var plugins_vrt = require('./fetchers/vrt');


// Swagger stuff
//
var initializeSwagger = require('swagger-tools').initializeMiddleware;
// This assumes you're in the root of the swagger-tools
var swaggerObject = require('./piradio-api-1.0.0.json');
// Configure non-Swagger related middleware and server components prior to Swagger middleware
initializeSwagger(swaggerObject, function(middleware) {
	// Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
	app.use(middleware.swaggerMetadata());
	app.use(middleware.swaggerUi());
	
});



// Create webserver to make heroku happy...
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
	response.end('good morning');
});

app.get('/status', function(request, response) {
	response.json([
		plugins_vrt.status(),
		plugins_joefm.status()
	]);
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});


if (!process.env.FIREBASE_URL) {
	console.log('missing FIREBASE_URL in ENV - bailing out.');
	process.exit();
}

console.log('start fetchers');

var firebaseURL = process.env.FIREBASE_URL;

var aref = new Firebase(firebaseURL);
aref.authWithPassword({
	email: process.env.FIREBASE_USER,
	password: process.env.FIREBASE_PASS
}, function(error, authData) {
	if (error) {
		console.log("Login Failed!", error);
	} else {
		console.log("Authenticated successfully with payload:", authData);


		plugins_joefm.startFetcher(firebaseURL);
		plugins_vrt.startFetcher(firebaseURL);

	}
});