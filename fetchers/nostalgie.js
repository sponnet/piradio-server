var util = require('util');
var playlistdata = require('../lib/services/playlistdata');
var request = require("request")
var firebaseURL;
var _ = require('lodash');
var moment = require('moment');

module.exports = {

	startFetcher: function startFetcher(firebaseURL) {
		this.firebaseURL = firebaseURL;

		playlistdata.init({
			firebaseURL: this.firebaseURL
		});


		var postdata = {
			id: 'nostalgie',
			description: "What a feeling!",
			name: "Radio Nostalgie",
			website: 'http://www.nostalgie.eu',
			icon: 'http://www.nostalgie.eu/content/design/images/_2014/logo2014.gif'
		}
		playlistdata.postChannel(postdata);

		function fetchData() {


			downloadJSON(function(err, data) {
				//console.log("Got data:", data);

				try {

					var unixtimestamp = moment().hour(parseInt(data.tijd0.split('u')[0])).minutes(parseInt(data.tijd0.split('u')[1]));
					var songdata = {
						channelid: 'nostalgie',
						artist: data.artiest0,
						title: data.titel0,
						timestamp: unixtimestamp.toISOString(),
						unixtimestamp: unixtimestamp.unix(),
					};

					playlistdata.postSong(songdata);

					unixtimestamp = moment().hour(parseInt(data.tijd1.split('u')[0])).minutes(parseInt(data.tijd1.split('u')[1]));
					songdata = {
						channelid: 'nostalgie',
						artist: data.artiest1,
						title: data.titel1,
						timestamp: unixtimestamp.toISOString(),
						unixtimestamp: unixtimestamp.unix(),
					};

					playlistdata.postSong(songdata);

					unixtimestamp = moment().hour(parseInt(data.tijd2.split('u')[0])).minutes(parseInt(data.tijd2.split('u')[1]));
					songdata = {
						channelid: 'nostalgie',
						artist: data.artiest2,
						title: data.titel2,
						timestamp: unixtimestamp.toISOString(),
						unixtimestamp: unixtimestamp.unix(),
					};

					playlistdata.postSong(songdata);
				} catch (e) {
					console.error(e);
				}
			});
		}


		function downloadJSON(cb) {
			var when = moment().subtract(5, 'minutes');

			//console.log("Download JSON");
			var url = "http://www.nostalgie.eu/playlist/search/?d=" + when.year() + "-" + when.month() + "-" + when.date() + "&h=" + when.hour() + "&m=" + when.minute();
			request({
				url: url,
				json: true,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
				}
			}, function(error, response, body) {
				//console.log('got HTTP response');
				if (!error && response.statusCode === 200) {
					console.error(error);
					cb(error, body);
				} else {
					cb(error);
				}
			});



		}


		fetchData();

		// fetch the data status every 3 min.
		var checkInterval = setInterval(function() {
			fetchData();
		}, (4 * 60 + Math.random() * 30) * 1000);

	},

	status: function status() {
		return ({
			name: "nostalgie"
		});
	}


};