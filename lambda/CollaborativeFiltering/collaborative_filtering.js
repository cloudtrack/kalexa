var aws = require('aws-sdk');
var async = require('async');
var lambda = new aws.Lambda({
	region: 'us-east-1'
});

const db = new aws.DynamoDB.DocumentClient();
const S3_PREFIX = 'https://s3.amazonaws.com/kpopmusic/';
const DEFAULT_SONG = 3929469;


function getMostPlayedSongInPlaylist(songs) {
	var songCount = {};
	songs.forEach(function(song, idx) {
		var songId = song.songId;
		if(songCount[songId]) songCount[songId] += 1;
		else songCount[songId] = 1;
	});
	var mostPlayedSong, maxCount = 0;
	Object.keys(songCount).forEach(function(key, idx) {
		if(maxCount < songCount[key]) {
			maxCount = songCount[key];
			mostPlayedSong = key;
		}
	})
	if(!mostPlayedSong) mostPlayedSong = DEFAULT_SONG;
	return mostPlayedSong;
}

function getFavoriteArtistInPlaylist(songs) {
	var songCount = {};
	songs.forEach(function(song, idx) {
		var artistId = song.artistId;
		if(songCount[artistId]) songCount[artistId] += 1;
		else songCount[artistId] = 1;
	});
	var mostPlayedSong, maxCount = 0;
	Object.keys(songCount).forEach(function(key, idx) {
		if(maxCount < songCount[key]) {
			maxCount = songCount[key];
			mostPlayedSong = key;
		}
	})
	if(!mostPlayedSong) mostPlayedSong = DEFAULT_SONG;
	return mostPlayedSong;
}

exports.handler = function(event, context, callback) {
	var userId = event.userId;
	var songId = DEFAULT_SONG; // default songs
	async.waterfall([
		function(cb) { // select playlist
			var playlistType = Math.floor(Math.random()*2); // 2 recommendations
			console.log('playlist', playlistType);
			
			if(playlistType === 0) { // same favorite song user's
				db.scan({ 
					TableName : 'kpop_playlist'
				}, function(err, data) {
					if(err) {
						cb(null); // default song
					}
					var playlists = data.Items;
					var mostPlayedSong = DEFAULT_SONG;
					// get current user's most played song
					for(var i = 0 ; i < playlists.length ; i++) {
						var p = playlists[i]; 
						var idx = i;
						if(p.userId === userId) { 
							mostPlayedSong = getMostPlayedSongInPlaylist(p.songs);
							var recommendUserIdx = -1;

							// find user whose most played song issame as current user's
							for(var i = 0 ; i < playlists.length ; i++) {
								var p = playlists[i]; 
								var idx = i;
								var userMostPlayed = getMostPlayedSongInPlaylist(p.songs);
								console.log(userMostPlayed);
								if(userMostPlayed === mostPlayedSong) {
									recommendUserIdx = idx;
									var playlist = playlists[recommendUserIdx];
									if(playlist && playlist.songs) { // 
										var songs = playlist.songs;

										// remove most played song from the list, to prevent recommendation is same all the time
										songs.forEach(function(song, idx) {
											if(song.songId === mostPlayedSong) delete songs[idx];
										});
										cb(null, songs);
									} else {
										cb(null); // default song
									}
									break;
								}
							}
							if(recommendUserIdx === -1) { // random user's
								var random_idx = Math.floor(Math.random()*playlists.length);

								var playlist = playlists[random_idx];
								if(playlist && playlist.songs) { // 
									var songs = playlist.songs;
									cb(null, songs);
								} else {
									cb(null); // default song
								}
							}
							break;
						}
					}
				});
			} else { // same favoirte artist user's
				db.scan({ 
					TableName : 'kpop_playlist'
				}, function(err, data) {
					if(err) {
						cb(null); // default song
					}
					var playlists = data.Items;
					var favoriteArtist;
					// get current user's most played song
					for(var i = 0 ; i < playlists.length ; i++) {
						var p = playlists[i];
						var idx = i;
						if(p.userId === userId) { 
							favoriteArtist = getFavoriteArtistInPlaylist(p.songs);
							var recommendUserIdx = -1;
							// find user whose favorite artist is same as current user's
							for(var i = 0 ; i < playlists.length ; i++) {
								var p = playlists[i];
								var idx = i;
								var userFavoriteArtist = getFavoriteArtistInPlaylist(p.songs);
								if(userFavoriteArtist === favoriteArtist) {
									recommendUserIdx = idx;

									var playlist = playlists[recommendUserIdx];
									if(playlist && playlist.songs) { // 
										var songs = playlist.songs;
										cb(null, songs);
									} else {
										cb(null); // default song
									} 
									break;
								}
							}
							if(recommendUserIdx === -1) { // random user's
								var random_idx = Math.floor(Math.random()*playlists.length);

								var playlist = playlists[random_idx];
								if(playlist && playlist.songs) { // 
									var songs = playlist.songs;
									cb(null, songs);
								} else {
									cb(null); // default song
								}
							}
							break;
						}
					}
				});
			}
		}, function(songs, cb) { // select song in playlist
			if(songs) {
				var type = Math.floor(Math.random() * 4);
				console.log('song type', type);
				if(type === 0) { // most recent played
					songId = songs[songs.length - 1].songId;
					cb(null);
				} else if(type === 1) { // random
					var random_idx = Math.floor(Math.random()*songs.length);
					songId = songs[random_idx].songId;
					cb(null);
				} else if(type === 2) { // favoriteArtist's random songs
					var favoriteArtist = getFavoriteArtistInPlaylist(songs);
					var artistSongs = [];
					songs.forEach(function(song, idx) {
						if(song.artistId == favoriteArtist) 
						    artistSongs.push(song.songId);
						
						if(idx === songs.length - 1) {
        					var random_idx = Math.floor(Math.random()*artistSongs.length);
        					songId = artistSongs[random_idx];
        					cb(null);
						}
					});
				} else { // most played
					songId = getMostPlayedSongInPlaylist(songs);
					cb(null);
				}
			} else {
				cb(null); // default song
			}
		}
	], function(err, result) {
		if(err) {
			console.log(err);
			context.done('error', err);
		}
		if(!songId) songId = DEFAULT_SONG;
		context.succeed(S3_PREFIX + songId+ '.mp3');
	});
}

//exports.handler();

