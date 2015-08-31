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
			console.log('hitFM fetcher starting');

			var postdata = {
				id: 'hitfm',
				description: 'Hit FM',
				name: 'Hit FM',
				website: 'http://www.hitfm.be/',
				icon: 'https://i.ytimg.com/i/2d0sSLxPfnYO6jhI5TtSjg/mq1.jpg'
			};


			console.log("hitFM channel to be saved=", postdata);

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
			name: "hitFM"
		});
	}


};

function fetchData() {
	request({
		uri: "http://static.hitfm.be/custom/livestream_coverimg.php",
	}, function(error, response, body) {
		var result = extract(body);

		if (result) {

			var songdata = {
				channelid: 'hitfm',
				artist: result.artist,
				image: result.image,
				title: result.title,
				unixtimestamp: Math.floor(new Date().getTime() / 1000),
			};
			//console.log('song data : ', songdata);

			playlistdata.postSong(songdata);
		} else {
			console.error('HitFM : nothing to save');
		}

	});
}

/*
console.log(extract('<p><img src="http://is3.mzstatic.com/image/pf/us/r30/Music1/v4/01/30/ce/0130ce9e-2432-acda-9f1b-bc008b1a87d1/8714221078725.100x100-75.jpg" width="70" alt="Ian Thomas - Till The Morning (ft Flo Rida And Lilana" title="Ian Thomas - Till The Morning (ft Flo Rida And Lilana" />Ian Thomas <br /> Till The Morning (ft Flo Rida And Lilana<br /><span class="social"><a href="" target="_blank">iTunes</a> | <a class="social-share" href="javascript:void(0)" rel="https://www.facebook.com/dialog/share?app_id=407886209257490&display=popup&href=&redirect_uri=http://www.hitfm.be">Facebook</a> | <a class="social-share" href="javascript:void(0)" rel="https://twitter.com/share?url=&text=Ik hoorde zonet dit leuk nummer op www.hitfm.be&via=HITFM_be">Twitter</a></span></p>'));
console.log(extract('<p>Live <br /> They Stood Up For Love</p>'));
console.log(extract('<p>Nieuws</p>'));
console.log(extract(''));
*/

function extract(body) {

	try {

		var $ = cheerio.load(body);
		var result = {};

		var img = $("p > img").attr('src');
		if (img) {
			//console.log("with image", img);
			var desc = $("p > img").attr('title');
			result.artist = desc.split('-')[0];
			result.title = desc.split('-')[1];
			result.image = $("p > img").attr('src');
		} else {
			//console.log("without image");
			var elem = $("p").children()
			if (elem && elem[0] && elem[0].prev && elem[0].next) {
				result.artist = elem[0].prev.data;
				result.title = elem[0].next.data;
			} else {
				console.error('problem parsing artist and title from this:', body);
				return;
			}
		}

		if (result.artist) {
			result.artist = result.artist.trim();
		}
		if (result.title) {
			result.title = result.title.trim();
		}
		return (result);
	} catch (e) {
		console.error(e);
		return;
	}
}

/*
<p><img src="http://is3.mzstatic.com/image/pf/us/r30/Music1/v4/01/30/ce/0130ce9e-2432-acda-9f1b-bc008b1a87d1/8714221078725.100x100-75.jpg" width="70" alt="Ian Thomas - Till The Morning (ft Flo Rida And Lilana" title="Ian Thomas - Till The Morning (ft Flo Rida And Lilana" />Ian Thomas <br /> Till The Morning (ft Flo Rida And Lilana<br />
<span class="social"><a href="" target="_blank">iTunes</a> | <a class="social-share" href="javascript:void(0)" rel="https://www.facebook.com/dialog/share?app_id=407886209257490&display=popup&href=&redirect_uri=http://www.hitfm.be">Facebook</a> | <a class="social-share" href="javascript:void(0)" rel="https://twitter.com/share?url=&text=Ik hoorde zonet dit leuk nummer op www.hitfm.be&via=HITFM_be">Twitter</a></span></p>
*/

/*
<p>Live <br /> They Stood Up For Love</p>
*/

/*
<p>Nieuws</p>
*/