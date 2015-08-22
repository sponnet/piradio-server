var spotifyservice = require('./spotifyservice');
var firebasecache = require('./firebasecache');


module.exports = {

	lookup: function(query, cb) {
		var cache = new firebasecache("/radioplus/cache/spotify");
		cache.get(query, function(err, val) {
			if (val) {
				cb(null, val);
			} else {
				spotifyservice.lookup(query, function(err, res) {
					if (res) {
						cache.set(query, res, function(err) {
							cb(null, res);
						})
					} else {
						cb();
					}
				});
			}
		});
	}
};