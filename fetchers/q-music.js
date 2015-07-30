var util = require('util');
var playlistdata = require('../services/playlistdata');
var SockJS = require('sockjs-client');

var firebaseURL;
var sock;
var recInterval = null;

module.exports = {

	startFetcher: function startFetcher(firebaseURL) {
		this.firebaseURL = firebaseURL;
		console.log("Starting fetcher Q-music");
		playlistdata.init({
			firebaseURL: this.firebaseURL
		});


		function connectSocket() {
			sock = new SockJS('http://socket.api.q-music.be/api');
			clearInterval(recInterval);


			sock.onopen = function() {
				console.log('socket opened');
				// ff abbonneren op de liekeslijst aub
				sock.send("{\"action\":\"join\",\"id\":1,\"sub\":{\"station\":\"qmusic_be\",\"entity\":\"plays\",\"action\":\"play\"},\"backlog\":50}");
				var postdata = {
						id: 'q_music',
						description: 'Q Music',
						name: 'Q Music',
						website: 'http://q-music.be',
						icon: 'http://a3.mzstatic.com/eu/r30/Purple7/v4/6d/0a/5a/6d0a5aef-958d-248b-45ce-edf460be6661/icon175x175.png'
					}
					playlistdata.postChannel(postdata);
			};

			sock.onmessage = function(e) {
				var d = JSON.parse(e.data);
				d = JSON.parse(d.data);
				console.log('--------');
				console.log('message', d);
				console.log('action=', d.action);

				// if action==play then its an update of the playlist
				if (d.action == 'play') {
					console.log('Q-Music play message');
					var songdata = {
						channelid: 'q_music',
						artist: d.data.artist.name,
						image: 'http://static4.q-music.vmmacdn.be/web_list/itemlist_big_desktop' + d.data.thumbnail,
						thumb: 'http://static4.q-music.vmmacdn.be/web_list/itemlist_big_desktop' + d.data.thumbnail,
						title: d.data.title,
						unixtimestamp: Math.floor(new Date(Date.parse(d.data.played_at)).getTime() / 1000),
						videoid: d.data.youtube_id || null,
						spotifyurl: d.data.spotify_url || null
					};
					console.log('song data : ', songdata);

					playlistdata.postSong(songdata);
				}
				console.log('--------');

			};

			sock.onclose = function() {
				console.log('socket disconnected. Attempt to reconnect');
				socket = null;
				recInterval = setInterval(function() {
					connectSocket();
				}, 2000);
			};


		}

		connectSocket();


		// ping the socket status every 20s and reconnect if neccesary...
		var checkInterval = setInterval(function() {
			if (sock.readyState != 1) {
				console.log('socket is dead. Reconnect please...');
				connectSocket();
			} else {
				//				console.log('socket is alive.');
			}
		}, 20000);

	},

	status: function status() {
		return ({
			name: "JoeFM",
			socketopen: sock.readyState == 1 ? true : false,
			sockstatus: sock.readyState
		});
	}


};