var Firebase = require("firebase");
var fs = require('fs');
var _ = require('lodash');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var spotifyservice = require('./cachedspotifyservice');
var async = require('async');
var firebaseURL;

var lastsongs;

module.exports = {

	init: function(config, cb) {
		firebaseURL = config.firebaseURL;
		if (!lastsongs) {
			var ref = new Firebase(firebaseURL + "/radioplus/channels");
			// Attach an asynchronous callback to read the data at our posts reference
			ref.once("value", function(snapshot) {
				lastsongs = {};
				//console.log("start fetch finished");
				snapshot.forEach(function(c) {
					var channel = c.val();
					//console.log('channeldata', channel);
					//console.log("Channel ", channel.id);
					//console.log("lastplayed  ", channel.lastsong);
					lastsongs[channel.id] = channel.lastsong;
				});
				if (cb) cb();
			});
		} else {
			if (cb) cb();
		}
	},



	postChannel: function postChannel(channeldata) {

		var ref = firebaseURL + "/radioplus/channels/" + channeldata.id;
		//console.log("Found a channel " + ref);

		var channel = new Firebase(ref);
		channel.update(channeldata, function(error) {
			if (error) {
				console.error("Data could not be saved." + error);
			} else {
				//console.log("Data for channel " + channeldata.name + " saved successfully.");
			}
		});

	},



	postSong: function postSong(songdata) {

		// removes all undefined properties in an object
		function removeUndefinedProps(obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop) && obj[prop] === undefined) {
					delete obj[prop];
				}
			}
			return obj;
		}

		// trim strings in an object ( depth = 1 )
		function trimStrings(obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop) && (typeof obj[prop] === 'string' || obj[prop] instanceof String)) {
					obj[prop] = obj[prop].trim();
				}
			}
			return obj;
		}

		function saveData(songdata, cb) {

			songdata = trimStrings(removeUndefinedProps(songdata));

			var hash = crypto.createHash('md5').update(songdata.unixtimestamp.toString()).digest("hex");

			var now = new Date();
			var fullDaysSinceEpoch = Math.floor(now / 8.64e7);
			var url = firebaseURL + "/radioplus/playlists/" + songdata.channelid + "/" + fullDaysSinceEpoch + "/" + hash;
			//console.log('postSong firebase URL = "' + url + '"');
			//console.log('postSong data = ', songdata);
			var myFirebaseRef = new Firebase(url);
			myFirebaseRef.set(songdata, function(error) {
				if (error) {
					console.error("Data could not be saved." + error);
					cb(error);
				} else {
					//console.log("Data saved successfully.");
					cb();
				}
			});

		}

		var songquery = songdata.artist + " " + songdata.title;

		console.log('post song - ', songdata.channelid, ' : ' + songquery);

		if (lastsongs && lastsongs[songdata.channelid] && lastsongs[songdata.channelid] == songquery) {
			//console.log("The song ", songquery, ' was the last played. Duplicate...');
			return;
		} else {
			//console.log('The song ', songquery, ' is a new song');
		}

		async.series([
				function resolveYouTube(callback) {
					//console.log('Resolving Youtube');
					if (!songdata.videoid) {
						getYouTubeURL(songquery, function(err, data) {
							if (data && data.items && data.items[0] && data.items[0].id && data.items[0].id.videoId) {
								songdata.videoid = data.items[0].id.videoId;
							} else {
								console.error('No Youtube link found for query ', songquery);
							}
							callback();
						});
					} else {
						//console.log('Already have Youtube URL');
						callback();
					}
				},
				function resolveSpotify(callback) {
					//console.log('Resolving Spotify');
					if (!songdata.spotifyurl) {
						spotifyservice.lookup(songquery, function(err, res) {
							//console.log('spotify resolved result', res);
							if (res) {
								songdata.spotifyurl = res.external_urls.spotify;
								songdata.popularity = res.popularity;
								if (!songdata.image) {
									//console.log('looking for image in spotify result');
									if (res.album && res.album.images && res.album.images[1]) {
										songdata.image = res.album.images[1].url;
										//console.log('found... using URL ', songdata.image);
									}
								}
								songdata.title = res.name;
								if (res.artists && res.artists[0]){
									songdata.artist = res.artists[0].name;
								}
							}
							callback();
						});
					} else {
						//console.log('Already have Spotify URL');
						callback();
					}
				}
			],
			// save the song now
			function(err, results) {
				//console.log('channel ', songdata.channelid, ' resolved everything --> Save now');
				saveData(songdata, function(err) {
					// update last updated date of channel
					var url = firebaseURL + "/radioplus/channels/" + songdata.channelid;
					//console.log('update lastmodified of channel ', songdata.channelid);
					var ref = new Firebase(url);
					ref.update({
						lastupdate: Math.floor(new Date().getTime() / 1000),
						lastsong: songquery
					}, function(err) {
						lastsongs[songdata.channelid] = songquery;
						//console.log('done - last song on channel ', songdata.channelid, ' is now ', songquery);
					});
				});

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
			//console.log('Youtube cache hit ' + query, snapshot.val());
			return cb(null, snapshot.val());
		} else {
			//console.log('Youtube cache miss ' + query, snapshot.val());
			var YouTube = require('youtube-node');
			var youTube = new YouTube();

			youTube.setKey('AIzaSyCMmHW8n0zWxnPT6BvOFIcvBVjGC1GLG2E');

			youTube.search(query, 2, function(error, result) {
				if (error) {
					console.error(error);
					return cb(error);
				} else {
					//console.log('Youtube lookup result ' + query, ': ', result);

					// save this in our cache..
					var updateUrl = url + "/" + hash;
					var ref = new Firebase(updateUrl);
					ref.update(result);

					return cb(null, result);

				}
			});
		}
	});
}