/**
 * upload mp3 files about name of other songs that are not in S3 yet
 * @param {nth}
 * @return list of 4 other songs (if the number of song is less than 4, return as much as the number of song)
 */

const aws = require('aws-sdk');
const lambda = new aws.Lambda();
var s3 = new aws.S3();

exports.handler = (event, context, callback) => {
    var dynamodb = new aws.DynamoDB.DocumentClient();
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
                    var artistFileName = JSON.stringify(songs[0].artistId) + '1.mp3';
                    var payload = {
                        text: songs[0].artistName,
                        fileName: artistFileName
                    };
                    var params = {
                        FunctionName: 'TTS',
                        Payload: JSON.stringify(payload)
                    };
                    makeAudioFile(params, artistFileName);
                    for(var i=0; i<songs.length; i++){
                        temp = songs[i].songName;
                        idx = temp.indexOf("(");
                        if(idx != -1){
                            songs[i].songName = temp.substring(0,idx-1);
                        }
                        var songFileName = songs[i].songId + '1.mp3';
                        payload = {
                            text: songs[i].songName,
                            fileName: songFileName
                        };
                        console.log('fileName: ' + songFileName);
                        params = {
                            FunctionName: 'TTS',
                            Payload: JSON.stringify(payload)
                        };
                        makeAudioFile(params, songFileName);
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

function makeAudioFile(params, filename){
    var url = s3.getSignedUrl('getObject', {Bucket: 'koreantts', Key: filename});
    if(url === null){
        tts(params);
    } else {
        console.log(filename + ' already exists');
    }
}
