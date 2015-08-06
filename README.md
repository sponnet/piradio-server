# piradio-server
Pi Radio server component that fetches all kind of radio station playlists into a firebase instance.

## prerequisites
Heroku toolbelt or Foreman (https://github.com/ddollar/foreman)



## usage

``npm install``

Create a config for local development
``cp .env_dist .env``

And edit the file accordingly.
You will need

### A Firebase instance
https://www.firebase.com/account

* FIREBASE_PASS
* FIREBASE_URL
* FIREBASE_USER

### A Spotify developer account and an application
https://developer.spotify.com/my-applications

* SPOTIFY_CLIENTID=
* SPOTIFY_CLIENTSECRET=
* SPOTIFY_REFRESHTOKEN=


Then start it up with:

``foreman run npm start``

## Running the tests
``foreman run npm test``


## Deploy to your heroku instance

``git push heroku master``




