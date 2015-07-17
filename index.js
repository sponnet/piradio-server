var util = require('util');
var socket = require('socket.io-client');
var client = socket.connect('http://radioplusnode.vrt.be');
var Firebase = require("firebase");
var fs = require('fs');
var _ = require('lodash');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var express = require('express');
var app = express();

// To make heroku happy...
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
  response.end('good morning');
});
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


if (!process.env.FIREBASE_URL) {
	console.log('missing FIREBASE_URL in ENV - bailing out.');
	process.exit();
}

console.log('start');

var firebaseURL = process.env.FIREBASE_URL;

client.on('connecting', function(transport_type) {
	console.log('connecting ' + transport_type);
});


// initial state
client.on('currentState', function(data) {
	console.log('currentState');

	var filteredchannels = ["21", "22", "23", "24", "13"];

	// get channel data
	_.map(data, function(item) {


		if (_.includes(filteredchannels, item.channel.id.toString())) {
			console.log("Channel " + item.channel.id + " is filtered.");
		} else {


			var ref = firebaseURL + "/radioplus/channels/" + item.channel.id;
			console.log("Found a channel " + ref);

			var channel = new Firebase(ref);
			channel.set(item.channel.info, function(error) {
				if (error) {
					console.log("Data could not be saved." + error);
				} else {
					console.log("Data for channel " + item.channel.info.name + " saved successfully.");
				}
			});
		}
	});
});

client.on('songChange', function(data) {
	console.log('songChange');
	console.log(util.inspect(data, true, null));

	if (data.data.artist && data.data.title) {
		saveCurrentSong(data.channelId, data.data);
	} else {
		console.log('no song info...');
	}
});


client.on('playlistChange', function(data) {
	console.log('playlistChange');

	var channelid = data.channelId;
	// save all songs in this playlist update
	_.map(data.data, function(item) {
		saveSong(channelid, item);
	});

	// update the timestamp
	var url = firebaseURL + "/radioplus/channels/" + channelid;
	var ref = new Firebase(url);
	ref.update({
		lastupdate: Math.floor(new Date().getTime() / 1000)
	});


});


function saveSong(channelid, songdata) {
	var hash = crypto.createHash('md5').update(songdata.timestamp).digest("hex");

	songdata.unixtimestamp = Math.floor(new Date(Date.parse(songdata.timestamp)).getTime() / 1000);

	//getYouTubeURL()
	// callback returns result.items[0].id.videoId

	var search = songdata.artist + " " + songdata.title;
	getYouTubeURL(search, function(err, result) {
		if (!err && result && result.items && result.items[0] && result.items[0].id) {
			songdata.videoid = result.items[0].id.videoId || null;
		}

		console.log(util.inspect(songdata));


		var now = new Date();
		var fullDaysSinceEpoch = Math.floor(now / 8.64e7);
		var url = firebaseURL + "/radioplus/playlists/" + channelid + "/" + fullDaysSinceEpoch + "/" + hash;
		console.log('id=' + url);
		var myFirebaseRef = new Firebase(url);
		myFirebaseRef.set(songdata, function(error) {
			if (error) {
				console.log("Data could not be saved." + error);
			} else {
				console.log("Data saved successfully.");
			}
		});


	});


}

// callback returns result.items[0].id.videoId
function getYouTubeURL(query, cb) {

	var YouTube = require('youtube-node');

	var youTube = new YouTube();

	youTube.setKey('AIzaSyCMmHW8n0zWxnPT6BvOFIcvBVjGC1GLG2E');

	youTube.search(query, 2, function(error, result) {
		if (error) {
			console.log(error);
			cb(error);
		} else {

			console.log(JSON.stringify(result, null, 2));
			cb(null, result);

		}
	});



}

function saveCurrentSong(channelid, songdata) {

	songdata.unixtimestamp = Math.floor(new Date(Date.parse(songdata.timestamp)).getTime() / 1000);
	console.log(util.inspect(songdata));

	var now = new Date();
	var url = firebaseURL + "/radioplus/currentsong/" + channelid;
	console.log('id=' + url);
	var myFirebaseRef = new Firebase(url);
	myFirebaseRef.set(songdata, function(error) {
		if (error) {
			console.log("Data could not be saved." + error);
		} else {
			console.log("Data saved successfully.");
		}
	});

}

client.on('message', function(data) {
	console.log('message');
	console.log(data);
});

client.on('disconnect', function() {
	console.log('disconnect');
});


client.on('connect', function() {
	console.log('connected');
});