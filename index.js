var util = require('util');
var Firebase = require("firebase");
var fs = require('fs');
var express = require('express');
var app = express();
var _ = require('lodash');
var moment = require('moment');

// load the plugins
var plugins = {
	plugins_joefm: require('./fetchers/joefm'),
	plugins_vrt: require('./fetchers/vrt'),
	plugins_538: require('./fetchers/538'),
	plugins_nostalgie: require('./fetchers/nostalgie'),
	plugins_qmusic: require('./fetchers/q-music'),
	plugins_hitfm: require('./fetchers/hitfm'),
};



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

	var ref = new Firebase(firebaseURL + "/radioplus/channels");
	// Attach an asynchronous callback to read the data at our posts reference
	ref.once("value", function(snapshot, cb) {
		var globalok = true;
		var channelinfo = _.reduce(snapshot.val(), function(result, n, key) {
			var r = {
				name: n.name,
				lastupdate: n.lastupdate
			};
			var age_in_min = moment.duration(1000 * (Math.floor(new Date().getTime() / 1000) - n.lastupdate)).asMinutes();
			if (n.lastupdate) {
				r.lastupdate_age_in_min = Math.floor(age_in_min);
				r.lastupdate_sanity = (age_in_min > 8*60) ? false : true;
			}
			if (r.lastupdate_sanity === false) {
				globalok = false;
			}

			result.push(r);

			return result;
		}, []);

		var status = _.reduce(plugins, function(acc, plugin) {
			acc.push(plugin.status());
			return acc;
		}, []);


		response.status(globalok ? 200 : 503).json({
			plugins: status,
			channels: channelinfo,
			globalstatus: globalok ? "globalstatus_ok" : "globalstatus_error"
		});
		response.end();
	});
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

		_.map(plugins, function(plugin, key) {
			console.log("Starting fetcher " + key);
			plugin.startFetcher(firebaseURL);
		});

	}
});