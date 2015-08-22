'use strict';
var Firebase = require("firebase");
var chai = require('chai');
var expect = chai.expect;
var firebasecache = require('../firebasecache');

describe('Firebase cache', function() {

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

  describe('FB cache', function() {


    var cache = new firebasecache("/radioplus/cache/test");

    it('should set a value', function(done) {
      cache.set("a", {
        b: "c"
      }, function(err) {
        expect(err).not.to.exist;
        done();
      })
    });

    it('should get a value', function(done) {
      cache.get("a",function(err,val) {
        expect(err).not.to.exist;
        expect(val).to.exist;
        expect(val.b).to.exist;
        expect(val.b).to.equal("c");
        done();
      })
    });

  });
});