var Firebase = require("firebase");
var fs = require('fs');
var _ = require('lodash');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var spotifyservice = require('./spotifyservice');
var async = require('async');
var firebaseURL;

module.exports = {

	init: function(config) {
		firebaseURL = config.firebaseURL;
	},

	postChannel: function postChannel(channeldata) {

		var ref = firebaseURL + "/radioplus/channels/" + channeldata.id;
		console.log("Found a channel " + ref);

		var channel = new Firebase(ref);
		channel.update(channeldata, function(error) {
			if (error) {
				console.log("Data could not be saved." + error);
			} else {
				console.log("Data for channel " + channeldata.name + " saved successfully.");
			}
		});

	},



	postSong: function postSong(songdata) {


		function saveData(songdata) {
			var hash = crypto.createHash('md5').update(songdata.unixtimestamp.toString()).digest("hex");

			var now = new Date();
			var fullDaysSinceEpoch = Math.floor(now / 8.64e7);
			var url = firebaseURL + "/radioplus/playlists/" + songdata.channelid + "/" + fullDaysSinceEpoch + "/" + hash;
			console.log('postSong firebase URL = "' + url + '"');
			console.log('postSong data = ', songdata);
			var myFirebaseRef = new Firebase(url);
			myFirebaseRef.set(songdata, function(error) {
				if (error) {
					console.log("Data could not be saved." + error);
				} else {
					console.log("Data saved successfully.");
				}
			});

			// update last updated date of channel
			var url = firebaseURL + "/radioplus/channels/" + songdata.channelid;
			console.log('update lastmodified of channel ', songdata.channelid);
			var ref = new Firebase(url);
			ref.update({
				lastupdate: Math.floor(new Date().getTime() / 1000)
			});

		}

		var songquery = songdata.artist + " " + songdata.title;
		console.log('post song - ', songdata.channelid, ' : ', songquery);

		async.series([
				function resolveYouTube(callback) {
					console.log('Resolving Youtube');
					if (!songdata.youtubeid) {
						getYouTubeURL(songquery, function(err, data) {
							if (data && data.items && data.items[0] && data.items[0].id && data.items[0].id.videoId) {
								songdata.videoid = data.items[0].id.videoId;
							} else {
								console.error('No Youtube link found for query ', songquery);
							}
							callback();
						});
					} else {
						console.log('Alreaady have Youtube URL');
						callback();
					}
				},
				function resolveSpotify(callback) {
					console.log('Resolving Spotify');
					if (!songdata.spotifyurl) {
						spotifyservice.lookup(songquery, function(err, res) {
							if (res) {
								songdata.spotifyurl = res;
							}
							callback();
						});
					} else {
						console.log('Alreaady have Spotify URL');
						callback();
					}
				}
			],
			// save the song now
			function(err, results) {
				console.log('channel ', songdata.channelid, ' resolved everything --> Save now');
				saveData(songdata);
			});


	},
	getYouTubeURL: getYouTubeURL

};

function getYouTubeURL(query, cb) {
	var hash = crypto.createHash('md5').update(query).digest("hex");
	var url = firebaseURL + "/radioplus/cache/youtube";
	//console.log('youtube=', url);
	var ref = new Firebase(url);

	ref.child(hash).once('value', function(snapshot) {
		if (snapshot.val() !== null) {
			console.trace('Youtube cache hit ' + query); 
			cb(null, snapshot.val());
		} else {
			var YouTube = require('youtube-node');
			var youTube = new YouTube();

			youTube.setKey('AIzaSyCMmHW8n0zWxnPT6BvOFIcvBVjGC1GLG2E');

			youTube.search(query, 2, function(error, result) {
				if (error) {
					console.log(error);
					cb(error);
				} else {

					// save this in our cache..
					var updateUrl = url + "/" + hash;
					var ref = new Firebase(updateUrl);
					ref.update(result);

					cb(null, result);

				}
			});
		}
	});
}