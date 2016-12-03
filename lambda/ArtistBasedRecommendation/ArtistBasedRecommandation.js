/**
 * upload mp3 files about name of other songs that are not in S3 yet
 * @param {nth}
 * @return list of 4 other songs (if the number of song is less than 4, return as much as the number of song)
 */

const aws = require('aws-sdk');
const lambda = new aws.Lambda();
var s3 = new aws.S3();
var dynamodb = new aws.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    var params = {
        TableName: 'kpop_chart',
        Key : {
            "chart" : "realtimeChart"
        }
    };
    dynamodb.get(params, function(err, data) {
        if(err) {
            console.log(err, err.stack);
        } else {
            var chart = data.Item.chartData;
            var song = chart[event.nth];
            var payload = {
                artistId: song.artists[0].artistId,
                artistName: song.artists[0].artistName,
                songId: song.songId
            };
            lambda.invoke({
                FunctionName: 'GetOtherSongs',
                Payload: JSON.stringify(payload)
            }, function(err, data) {
                if(err) console.log(err, err.stack);
                else {
                    var songs = JSON.parse(data.Payload);
                    var temp = songs[0].artistName;
                    var idx = temp.indexOf("(");
                    if(idx != -1){
                    songs[0].artistName = temp.substring(0,idx-1);
                    }

                    var artistId = songs[0].artistId;
                    var artistFileName = JSON.stringify(artistId) + '1.mp3';
                    var payload = {
                        text: songs[0].artistName,
                        fileName: artistFileName
                    };
                    var params = {
                        FunctionName: 'TTS',
                        Payload: JSON.stringify(payload)
                    };
                    makeAudioFile(params, artistId, artistFileName);
                    for(var i=0; i<songs.length; i++){
                        temp = songs[i].songName;
                        idx = temp.indexOf("(");
                        if(idx != -1){
                            songs[i].songName = temp.substring(0,idx-1);
                        }
                        var songId = songs[i].songId;
                        var songFileName = songId + '1.mp3';
                        payload = {
                            text: songs[i].songName,
                            fileName: songFileName
                        };
                        params = {
                            FunctionName: 'TTS',
                            Payload: JSON.stringify(payload)
                        };
                        songId = Number(songId);
                        makeAudioFile(params, songId, songFileName);
                    }
                    callback(null, songs);
                }
            });
        }
    });
};

function tts(params){
    lambda.invoke(params, function(err, data) {
        if(err) console.log(err, err.stack);
        else console.log('ttsUrl:', data.Payload);
    });
}

function makeAudioFile(params, id, filename){
    /*s3.getObject({Bucket: 'koreantts', Key: filename}, function (err, data) {
            if(err) tts(params);
            else console.log(filename + ' already exists');
    });*/
    dynamodb.get({TableName: 'kpop_name', Key: {"Id": id}}, function(err, data) {
       if(err || Object.keys(data).length === 0){
           tts(params);
           dynamodb.put({
               TableName: 'kpop_name',
               Item: {
                   "Id" : id,
                   "url": "https://s3.amazonaws.com/koreantts/" + filename
               }
           }, function(err, data) {
              if(err) console.log(err, err.stack);
           });
       } else {
           console.log(id, 'url : ' + data.Item.url);
       }
    });
}
