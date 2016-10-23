'use strict';

/**
 * Get other songs of the artist, using Melon API
 * @param {artistId, artistName, songId}
 * @return list of 5 other songs
 */

const http = require('http');
const querystring = require('querystring');
const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
    var data = querystring.stringify({
        'version': 1,
        'page': 1,      // first page, one page has (count) of songs
        'count': 6,    // # of songs
        'searchKeyword': event.artistName
    });

    var options = {
        hostname: 'apis.skplanetx.com',
        port: 80,
        path: '/melon/songs?' + data,
        method: 'get',
        headers: {
            'appKey': '75a70240-3e0a-378e-aad0-c6163424ce60'
        }
    };

    var req = http.request(options, (res) => {
        let body = '';
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Successfully processed HTTPS response');
            body = JSON.parse(body);

            var songs = [];
            var i = 0;
            for(var n=0; n<6; n++){
                var src = body.melon.songs.song[n];
                if(event.songId != src.songId){
                    songs[i] = {};
                    songs[i].songId = src.songId;
                    songs[i].songName = src.songName;
                    songs[i].artistName = event.artistName;
                    songs[i].artistId = event.artistId;
                    i++;
                }
                if(i == 5)
                    break;
            }
        callback(null, songs);
        });
    });

    req.on('error', callback);
    req.write(data);
    req.end();
};
