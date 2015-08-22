'use strict';
var Firebase = require("firebase");
var crypto = require('crypto');

// namespace parameter = "/your/location/in/firebase";
function FirebaseCache(namespace) {
	this.namespace = namespace;
}


function getHash(key) {
	return crypto.createHash('md5').update(key.toString()).digest("hex")
}

FirebaseCache.prototype.getUrl = function getUrl(key) {
	var suffix = "";
	if (key) {
		suffix = "/" + getHash(key);
	}
	return (process.env.FIREBASE_URL + this.namespace + suffix);
}

FirebaseCache.prototype.get = function(key, callback) {
	var ref = new Firebase(this.getUrl());

	ref.child(getHash(key)).once('value', function(snapshot) {
		if (snapshot.val() !== null) {
			return callback(null, snapshot.val().value);
		} else {
			return callback();
		};
	});
};

FirebaseCache.prototype.set = function(key, value, callback) {
	var ref = new Firebase(this.getUrl(key));
	ref.update({
		created: new Date(),
		value: value
	}, callback);
};


module.exports = FirebaseCache;