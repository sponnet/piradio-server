var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi();
var _ = require('lodash');
var spotifyUri = require('spotify-uri');

var mytoken = {
	refresh_token: process.env.SPOTIFY_REFRESHTOKEN
};
var currenttoken = null;


var oauth2 = require('simple-oauth2')({
  clientID: process.env.SPOTIFY_CLIENTID,
  clientSecret: process.env.SPOTIFY_CLIENTSECRET,
  site: 'https://accounts.spotify.com',
  tokenPath: '/api/token',
  authorizationPath: '/authorize',
  useBasicAuthorizationHeader: false
});


function spotify_getaccesstoken(cb) {
	if (!currenttoken || oauth2.accessToken.create(currenttoken).expired()) {
		//console.log('Refreshing token. currenttoken=' + currenttoken);
		var token = oauth2.accessToken.create(mytoken);
		token.refresh(function(error, result) {
			if (error) {
				//console.log("error ", error);
				cb(error);
			} else {
				currenttoken = result;
				cb(null, result.token.access_token);
			}
		});
	} else {
		//console.log('Still have a token. currenttoken=' + currenttoken);
		cb(null, currenttoken.token.access_token)
	}
}


module.exports = {
	lookup: function spotifylookup(query, cb) {
		spotify_getaccesstoken(function(err, access_token) {
			spotifyApi.setAccessToken(access_token);
			spotifyApi.searchTracks(query)
				.then(function(data) {
					if (data.body.tracks && data.body.tracks.total > 0) {
						var first = data.body.tracks.items[0];
						cb(null, first.external_urls.spotify);
					} else {
						cb();
					}
				}, function(err) {
					cb(err);
				});
		});
	}
};