var request = require("request");
var cheerio = require("cheerio");
var playlistdata = require('../lib/services/playlistdata');
var firebaseURL;

module.exports = {
	startFetcher: function startFetcher(firebaseURL) {
		this.firebaseURL = firebaseURL;

		playlistdata.init({
			firebaseURL: this.firebaseURL
		}, start);

		function start() {
			console.log('ClubFM fetcher starting');

			var postdata = {
				id: 'clubfm',
				description: 'Club FM',
				name: 'Club FM',
				website: 'http://www.radioclubfm.info/',
				icon: 'http://www.radiosplay.com/logos/5/4/8/0/54808.png'
			};


			console.log("ClubFM channel to be saved=", postdata);

			playlistdata.postChannel(postdata);

			fetchData();

			// fetch the data status every 3 min.
			var checkInterval = setInterval(function() {
				fetchData();
				//			}, (10 * 1000));
			}, (3 * 60 + Math.random() * 30) * 1000);
		}

	},
	status: function status() {
		return ({
			name: "ClubFM"
		});
	}


};

function fetchData() {
	request({
		uri: "http://id.web1.radiotuna.com/backpassage/backchannel.ashx?roomId=108982",
	}, function(error, response, body) {
		var result = extract(body);

		if (result) {

			var songdata = {
				channelid: 'clubfm',
				artist: result.artist,
				image: result.image,
				title: result.title,
				unixtimestamp: Math.floor(new Date().getTime() / 1000),
			};

			playlistdata.postSong(songdata);
		} else {
			console.error('ClubFM : nothing to save');
		}

	});
}

/*
console.log(extract('<p><img src="http://is3.mzstatic.com/image/pf/us/r30/Music1/v4/01/30/ce/0130ce9e-2432-acda-9f1b-bc008b1a87d1/8714221078725.100x100-75.jpg" width="70" alt="Ian Thomas - Till The Morning (ft Flo Rida And Lilana" title="Ian Thomas - Till The Morning (ft Flo Rida And Lilana" />Ian Thomas <br /> Till The Morning (ft Flo Rida And Lilana<br /><span class="social"><a href="" target="_blank">iTunes</a> | <a class="social-share" href="javascript:void(0)" rel="https://www.facebook.com/dialog/share?app_id=407886209257490&display=popup&href=&redirect_uri=http://www.hitfm.be">Facebook</a> | <a class="social-share" href="javascript:void(0)" rel="https://twitter.com/share?url=&text=Ik hoorde zonet dit leuk nummer op www.hitfm.be&via=HITFM_be">Twitter</a></span></p>'));
console.log(extract('<p>Live <br /> They Stood Up For Love</p>'));
console.log(extract('<p>Nieuws</p>'));
console.log(extract(''));
*/

//console.log(extract('<connectionId>76a3941affed401bb5c25fda66f775dd</connectionId><streams><stream streamName="ClubFM" streamUrl="http://shoutcast2.clubfmserver.be:8008/" bitrate="128" /></streams><song artistId="-1" trackId="-1">FELIX JAEHN - AINT NOBODY (LOVES ME BETTER)</song>'));

function extract(body) {

	try {

		var $ = cheerio.load(body);
		var result = {};

		var desc = $("song").text();
		result.artist = desc.split('-')[0];
		result.title = desc.split('-')[1];

		if (result.artist) {
			result.artist = result.artist.trim();
		}
		if (result.title) {
			result.title = result.title.trim();
		}

		if (result.artist.indexOf("NIEUWS") > -1) {
			//console.log('clubFM - nieuws');
			return;
		}

		return (result);
	} catch (e) {
		console.error(e);
		return;
	}
}