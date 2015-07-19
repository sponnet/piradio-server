var Firebase = require("firebase");
var fs = require('fs');
var _ = require('lodash');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var firebaseURL;

module.exports = {

	init: function(config) {

		console.log('init playlistdataservice ', config);

		this.firebaseURL = config.firebaseURL;
	},

	postChannel: function postChannel(channeldata) {

		var ref = this.firebaseURL + "/radioplus/channels/" + channeldata.id;
		console.log("Found a channel " + ref);

		var channel = new Firebase(ref);
		channel.set(channeldata, function(error) {
			if (error) {
				console.log("Data could not be saved." + error);
			} else {
				console.log("Data for channel " + channeldata.name + " saved successfully.");
			}
		});

	},



	postSong: function postSong(songdata) {

		var hash = crypto.createHash('md5').update(songdata.unixtimestamp.toString()).digest("hex");

		var now = new Date();
		var fullDaysSinceEpoch = Math.floor(now / 8.64e7);
		var url = this.firebaseURL + "/radioplus/playlists/" + songdata.channelid + "/" + fullDaysSinceEpoch + "/" + hash;
		console.log('postSong firebase URL = "' + url + '"');
		var myFirebaseRef = new Firebase(url);
		myFirebaseRef.set(songdata, function(error) {
			if (error) {
				console.log("Data could not be saved." + error);
			} else {
				console.log("Data saved successfully.");
			}
		});

		// update last updated date of channel
		var url = this.firebaseURL + "/radioplus/channels/" + songdata.channelid;
		var ref = new Firebase(url);
		ref.update({
			lastupdate: Math.floor(new Date().getTime() / 1000)
		});


	}

};