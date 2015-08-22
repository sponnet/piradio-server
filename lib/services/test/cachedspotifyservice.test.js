'use strict';
var Firebase = require("firebase");
var chai = require('chai');
var expect = chai.expect;
var spotifyservice = require('../cachedspotifyservice');

describe('cachedspotifyservice tests', function() {

  before(function(done) {
    var aref = new Firebase(process.env.FIREBASE_URL);
    aref.authWithPassword({
      email: process.env.FIREBASE_USER,
      password: process.env.FIREBASE_PASS
    }, function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
        done(error);
      } else {
        done();
      }
    });
  });

  describe('cachedspotifyservice get', function() {


    it('should lookup a value and create a cache entry', function(done) {
      spotifyservice.lookup("Beastie Boys - Sabotage", function(err, res) {
        expect(res).to.exist;
        expect(res).to.be.a.string;
        expect(res).to.equal("https://open.spotify.com/track/0Puj4YlTm6xNzDDADXHMI9");
        done();
      });
    });


  });
});