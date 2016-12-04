var aws = require('aws-sdk');
var async = require('async');
var lambda = new aws.Lambda({
	  region: 'us-east-1'
});

const db = new aws.DynamoDB.DocumentClient();
const S3_PREFIX = 'https://s3.amazonaws.com/kpopmusic/';

exports.handler = function(event, context, callback) {
	var userId = event.userId;

	var songId = 3929469; // default songs
	async.waterfall([
		function(cb) {
			var playlistType = Math.floor(Math.random()*2); // 2 recommendations
			playlistType = 0;
			if(playlistType === 0) { // random user's playlist
				db.scan({ 
					TableName : 'kpop_playlist'
				}, function(err, data) {
					if(err) {
						cb(null); // default song
					}
					console.log(data);
					var playlists = data.Items;
					var random_idx = Math.floor(Math.random()*playlists.length);
					var playlist = playlists[random_idx];
					console.log(playlist);
					if(playlist && playlist.songs) { // 
						var songs = playlist.songs;
						console.log(songs);
						cb(null, songs);
					} else {
					    cb(null); // default song
					}
				});
			} else { // TODO :similar playlist 
			    cb(null);
			}
		}, function(songs, cb) {
		    console.log(songs);
			if(songs) {
				var type = Math.floor(Math.random() * 3);
				if(type === 0) { // most recent played
					songId = songs[songs.length - 1];
				} else if(type === 1) { // random
				    var random_idx = Math.floor(Math.random()*songs.legnth);
					songId = songs[random_idx];
				} else { // most played
					var songCount = {};
					songs.forEach(function(song, idx) {
						if(songCount[song]) songCount[song] += 1;
						else songCount[song] = 1;
					});
					var maxSong, maxCount = 0;
					Object.keys(songCount).forEach(function(key, idx) {
						if(maxCount < songCount[key]) {
							maxCount = songCount[key];
							maxSong = key;
						}
					})
					songId = maxSong;
				}
				cb(null);
			} else {
				cb(null); // default song
			}
		}
	], function(err, result) {
		if(err) {
			console.log(err);
			context.done('error', err);
		}
		context.succeed(S3_PREFIX + songId+ '.mp3');
	});
}

//exports.handler();