/**
*
 * @param .
 * @return upload mp3 files about K-pop chart that are not in S3 yet
 */

const aws = require('aws-sdk');
const lambda = new aws.Lambda();

exports.handler = (event, context, callback) => {
    var params = {
        FunctionName: 'KpopChart',
        Payload: ""
    };
    lambda.invoke(params, function(err, data) {
        if(err) console.log(err, err.stack);
        else{
            var chart = JSON.parse(data.Payload);
            var s3 = new AWS.S3();

            for(var i=0; i<10; i++){
                var temp = chart[i].songName;
                var idx = temp.indexOf("(");
                if(idx != -1){
                    chart[i].songName = temp.substring(0,idx-1);
                }
                var songFileName = JSON.stringify(chart[i].songId) + '1';
                var payload = {
                    text: chart[i].songName,
                    key: songFileName
                };
                var params = {
                    FunctionName: 'TTS',
                    Payload: JSON.stringify(payload)
                };
                makeAudioFile(params, songFileName);

                var artistsNum = chart[i].artists.length;
                for(var j=0; j<artistNum; j++){
                    temp = chart[i].artists[j].artistName;
                    idx = temp.indexOf("(");
                    if(idx != -1){
                        chart[i].artists[j].artistName = temp.substring(0,idx-1);
                    }
                    var artistFileName = chart[i].artists[j].artistId + '1';
                    payload = {
                        text: chart[i].artists[j].artistName,
                        key: artistFileName
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
    s3.getSignedUrl('getObject', {Bucket: 'koreantts', Key: filename},
        function (err, url) {
            if(err) tts(params);
            else console.log(url, 'file is already exist');
    });
}
