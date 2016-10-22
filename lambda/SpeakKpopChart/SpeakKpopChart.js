/**
 *
 * @param .
 * @return upload mp3 files about K-pop chart that are not in S3 yet
 */

const aws = require('aws-sdk');
const lambda = new aws.Lambda();
var s3 = new aws.S3();

exports.handler = (event, context, callback) => {
    var params = {
        FunctionName: 'KpopChart',
        Payload: ""
    };
    lambda.invoke(params, function(err, data) {
        if(err) console.log(err, err.stack);
        else{
            var chart = JSON.parse(data.Payload);

            for(var i=0; i<10; i++){
                var temp = chart[i].songName;
                var idx = temp.indexOf("(");
                if(idx != -1){
                    chart[i].songName = temp.substring(0,idx-1);
                }
                var songFileName = JSON.stringify(chart[i].songId) + '1.mp3';
                var payload = {
                    text: chart[i].songName,
                    fileName: songFileName
                };

                var params = {
                    FunctionName: 'TTS',
                    Payload: JSON.stringify(payload)
                };
                makeAudioFile(params, songFileName);

                var artistsNum = chart[i].artists.length;
                for(var j=0; j<artistsNum; j++){
                    temp = chart[i].artists[j].artistName;
                    idx = temp.indexOf("(");
                    if(idx != -1){
                        chart[i].artists[j].artistName = temp.substring(0,idx-1);
                    }
                    var artistFileName = chart[i].artists[j].artistId + '1.mp3';
                    payload = {
                        text: chart[i].artists[j].artistName,
                        fileName: artistFileName
                    };
                    params = {
                        FunctionName: 'TTS',
                        Payload: JSON.stringify(payload)
                    };
                    makeAudioFile(params, artistFileName);
                }
            }
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
    s3.getObject({Bucket: 'koreantts', Key: filename}, function (err, data) {
            if(err) tts(params);
            else console.log(filename + ' already exists');
    });
}
