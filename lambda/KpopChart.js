'use strict';

/**
 * Getting K-pop chart listing of ranks, using Melon API
 * @param .
 * @return Top 10 chart of songs
 */

const http = require('http');
const querystring = require('querystring');
const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
    var data = querystring.stringify({
        'version': 1,
        'page': 1,      // first page, one page has (count) of songs
        'count': 10,    // # of songs
    });

    var options = {
        hostname: 'apis.skplanetx.com',
        port: 80,
        path: '/melon/charts/realtime?' + data,
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
/**
 *  chart = [{songId, songName, artists}, ...]
 *  artists: [{artistId, artistName}, ...]
 */
            var chart = new Array();
            for(var i=0; i<10; i++){
                var src = body.melon.songs.song[i];
                var artistsNum = src.artists.artist.length;
                chart[i] = {};
                chart[i].songId = src.songId;
                chart[i].songName = src.songName;
                chart[i].artists = new Array();
                for(var j=0; j<artistsNum; j++){
                    chart[i].artists[j] = {};
                    chart[i].artists[j].artistId = src.artists.artist[j].artistId;
                    chart[i].artists[j].artistName = src.artists.artist[j].artistName;
                }
            }

            //update chart data
            var lambda = new aws.Lambda();
            var payload = {
                tableName: 'kpop_chart',
                key: {'chart': 'realtimeChart'},
                updateExpression: 'set chartData = :chartData',
                expressionAttributeValues: {':chartData': chart}
            }
            var params = {
                FunctionName: 'MyUpdateData',
                Payload: JSON.stringify(payload)
            };

            lambda.invoke(params, function(err, data) {
                if(err) console.log(err, err.stack);
                else callback(null, chart);
            });
        });
    });

    req.on('error', callback);
    req.write(data);
    req.end();
};
