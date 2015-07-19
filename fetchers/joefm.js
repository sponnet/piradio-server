var util = require('util');
var playlistdata = require('../services/playlistdata');
var SockJS = require('sockjs-client');

var firebaseURL;

module.exports = {

	startFetcher: function startFetcher(firebaseURL) {
		this.firebaseURL = firebaseURL;

		playlistdata.init({
			firebaseURL: this.firebaseURL
		});


		var sock = new SockJS('http://socket.api.joe.be/api');
		sock.onopen = function() {
			console.log('open');
			// ff abbonneren op de liekeslijst aub
			sock.send("{\"action\":\"join\",\"id\":1,\"sub\":{\"station\":\"joe_fm\",\"entity\":\"plays\",\"action\":\"play\"},\"backlog\":50}");
			var postdata = {
				id: 'joe_fm',
				description: 'Joe FM',
				name: 'Joe FM',
				website: 'http://www.joe.be',
				icon: 'http://static1.q-music.vmmacdn.be//0/88/a5/88/877484/joe_logo.png'
			}
			playlistdata.postChannel(postdata);
		};

		sock.onmessage = function(e) {
			//			console.log('message', e.data);
			var d = JSON.parse(e.data);
			d = JSON.parse(d.data);
			console.log('--------');
			console.log('message', d);
			console.log('action=', d.action);

			// if action==play then its an update of the playlist
			if (d.action == 'play') {
				console.log('JOEFM play message');
				var songdata = {
					channelid: 'joe_fm',
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
			console.log('close');
		};

	},

	status: function status() {
		return ({
			name: "JoeFM",

		});
	}


};