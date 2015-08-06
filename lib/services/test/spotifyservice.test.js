'use strict';

var chai = require('chai');
var expect = chai.expect;
var spotifyservice = require('../spotifyservice');

describe('Spotify service', function() {

  before(function(done) {
    done();
  });

  describe('when looking up a song', function() {

    it('a good query should return a valid spotify URL', function(done) {
      spotifyservice.lookup("Beastie Boys - Sabotage", function(err, res) {
        expect(res).to.exist;
        expect(res).to.be.a.string;
        expect(res).to.equal("https://open.spotify.com/track/0Puj4YlTm6xNzDDADXHMI9");
        done();
      });
    });

    it('an unexisting query should return no error and no result', function(done) {
      spotifyservice.lookup("qepowueoqiwrpqworuqowr", function(err, res) {
        expect(err).not.to.exist;
        expect(res).not.to.exist;
        done();
      });
    });


    it('an invalid query should return an error', function(done) {
      spotifyservice.lookup("", function(err, res) {
        expect(err).to.exist;
        expect(res).not.to.exist;
        done();
      });
    });


  });
});