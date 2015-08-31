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
		// and klara (31)
		// and klara continuo (32)
		var filteredchannels = ["21", "22", "23", "24", "13", "31", "32"];

		client = socket.connect('http://radioplusnode.vrt.be');

		client.on('connecting', function(transport_type) {
			console.log('connecting ' + transport_type);
		});

		// initial state gets sent via the socket first
		// it contains the channel list and a lot of other info we don't use now.
		// for a sample , check the file ./sample-payloads/vrt-currentstate.json
		client.on('currentState', function(data) {
			console.log('VRT - received currentState');

			// get channel data
			_.map(data, function(item) {

				if (_.includes(filteredchannels, item.channel.id.toString())) {
					//console.log("Channel " + item.channel.info.name + " is filtered.");
				} else {


					var postdata = {
						id: item.channel.id,
						description: item.channel.info.description || null,
						name: item.channel.info.name,
						website: item.channel.info.website || null,
						//icon: 'http://static1.q-music.vmmacdn.be//0/88/a5/88/877484/joe_logo.png'
					};
					//console.log('channel to post', postdata);
					playlistdata.postChannel(postdata);

				}
			});
		});

		client.on('songChange', function(data) {});

		// this gets triggered when the playlist of a channel receives an update
		client.on('playlistChange', function(data) {
			console.log('VRT playlistChange');

			var channelid = data.channelId;

			// save all songs in this playlist update
			_.map(data.data, function(item) {
				if (_.includes(filteredchannels, channelid.toString())) {
					// skipped channel
					//console.log('skipping channel ' + channelid);
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
			};

			playlistdata.postSong(songdata_cleaned);
		}
	},

	status: function status() {
		return ({
			name: "VRT",
			socketopen: client.socket.open ? true : false,
		});
	}
};