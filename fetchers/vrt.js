var socket = require('socket.io-client');
var playlistdata = require('../lib/services/playlistdata');
var _ = require('lodash');

var firebaseURL;
var client;

module.exports = {

	startFetcher: function startFetcher(firebaseURL) {
		this.firebaseURL = firebaseURL;

		playlistdata.init({
			firebaseURL: this.firebaseURL
		});

		// config settings
		// this is a list of ignored channels
		// it contains all the regional RADIO2 channels
		// and a news only channel ( no music there )
		var filteredchannels = ["21", "22", "23", "24", "13"];

		client = socket.connect('http://radioplusnode.vrt.be');

		client.on('connecting', function(transport_type) {
			console.log('connecting ' + transport_type);
		});

		// initial state gets sent via the socket first
		// it contains the channel list and a lot of other info we don't use now.
		// for a sample , check the file ./sample-payloads/vrt-currentstate.json
		client.on('currentState', function(data) {
			console.log('currentState');

			// get channel data
			_.map(data, function(item) {

				if (_.includes(filteredchannels, item.channel.id.toString())) {
					console.log("Channel " + item.channel.info.name + " is filtered.");
				} else {


					var postdata = {
						id: item.channel.id,
						description: item.channel.info.description || null,
						name: item.channel.info.name,
						website: item.channel.info.website || null,
						//icon: 'http://static1.q-music.vmmacdn.be//0/88/a5/88/877484/joe_logo.png'
					};
					console.log('channel to post', postdata);
					playlistdata.postChannel(postdata);

				}
			});
		});

		client.on('songChange', function(data) {
			/*
			console.log('songChange');
			console.log(util.inspect(data, true, null));

			if (data.data.artist && data.data.title) {
				saveCurrentSong(data.channelId, data.data);
			} else {
				console.log('no song info...');
			}
			*/
		});

		// this gets triggered when the playlist of a channel receives an update
		client.on('playlistChange', function(data) {
			console.log('playlistChange');

			var channelid = data.channelId;

			// save all songs in this playlist update
			_.map(data.data, function(item) {
				if (_.includes(filteredchannels, channelid.toString())) {
					// skipped channel
					console.log('skipping channel ' + channelid);
				} else {
					saveSong(channelid, item);
				}
			});


		});


		function saveSong(channelid, songdata) {


			var songdata_cleaned = {
				channelid: channelid,
				artist: songdata.artist,
				image: songdata.image,
				thumb: songdata.thumb,
				title: songdata.title,
				unixtimestamp: Math.floor(new Date(Date.parse(songdata.timestamp)).getTime() / 1000),

				//spotifyurl: d.data.spotify_url || null
			};

			var search = songdata.artist + " " + songdata.title;
			getYouTubeURL(search, function(err, result) {
				if (!err && result && result.items && result.items[0] && result.items[0].id) {
					songdata_cleaned.videoid = result.items[0].id.videoId || null;
				}
				console.log('song to save', songdata_cleaned);
				playlistdata.postSong(songdata_cleaned);
			});
		}


		/*
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
		*/

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
	},

	status: function status() {
		return ({
			name: "VRT",
			socketopen: client.socket.open ? true : false,
		});
	}
};