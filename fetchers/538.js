var util = require('util');
var playlistdata = require('../lib/services/playlistdata');
var request = require("request")
var firebaseURL;
var _ = require('lodash');

var includedChannels = ['538'];

var lastfetched = null;
var lastmessage = "";

module.exports = {

	startFetcher: function startFetcher(firebaseURL) {
		this.firebaseURL = firebaseURL;

		playlistdata.init({
			firebaseURL: this.firebaseURL
		});


		function fetchData() {


			downloadJSON(function(err, data) {
				if (err) {
					this.lastmessage = "Error: " + err;
				} else {
					this.lastmessage = data;
					this.lastfetched = new Date();
				}

				console.log("Downloaded", data);
				var channelsWithTracks = _.reduce(data, function(accum, item) {

					//console.log("item=", item.label);

					if (_.includes(includedChannels, item.label)) {

						var postdata = {
							id: '538_' + item.label,
							description: item.title,
							name: item.title,
							website: 'http://',
							icon: ''
						}


						console.log("538 channel to be saved=", postdata);

						if (item.tracks && item.tracks[0]) {
							accum.push(item);
						}

						playlistdata.postChannel(postdata);
					}


					return accum;

				}, []);


				_.each(channelsWithTracks, function(item) {
					//console.log("Save this song", item);

					var track = item.tracks[0];

					var songdata = {
						channelid: '538_' + item.label,
						artist: track.artist,
						image: track.image,
						thumb: track.image,
						title: track.title,
						unixtimestamp: track.time_gmt,
						spotifyurl: track.spotify_url,
						youtubeid: track.youtube_id
					};
					console.log('538 song to be saved : ', songdata);
					playlistdata.postSong(songdata);
				});

			});
		}

		function downloadJSON(cb) {
			console.log("Download JSON");
			var url = "http://www.538.nl/ajax/VdaStationBundle/Station/jsonChannelData";
			request({
				url: url,
				json: true,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
				}
			}, function(error, response, body) {
				console.log('got HTTP response');
				if (!error && response.statusCode === 200) {
					cb(error, body);
				} else {
					cb(error);
				}
			})



		}


		fetchData();

		// fetch the data status every 3 min.
		var checkInterval = setInterval(function() {
			fetchData();
		}, (3 * 60 + Math.random() * 30) * 1000);

	},

	status: function status() {
		return ({
			name: "538",
			lastfetched: lastfetched,
			lastmessage: lastmessage
		});
	}


};