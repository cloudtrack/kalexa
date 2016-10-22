process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

'use strict';



/**
 * Make an MP3 file reading text which was given by param,
 * Using Naver TTS API
 * @param text 		: Korean string to read
 * @param fileName  : (Optional) File name to be saved in S3
 * @return the URL of an MP3 file
 *
 * MP3 file is saved in S3
 */

const https = require('https');
const querystring = require('querystring');
const aws = require('aws-sdk');
const fs = require('fs');
const cp = require('child_process');

exports.handler = (event, context, callback) => {
    var options = {
        hostname: 'openapi.naver.com',
        port: 443,
        path: '/v1/voice/tts.bin',
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Naver-Client-Id': '9NV5mB_ADv_99e3t_oey',
            'X-Naver-Client-Secret': 'jlVolLMkVy',
        }
    };
    var data = querystring.stringify({
        'speaker': 'mijin', // Korean, Female. (Male=jinho)
        'speed': '0', // -5x ~ 5x
        'text': event.text,
    });

	cp.exec(
		'cp /var/task/ffmpeg /tmp/.; chmod 755 /tmp/ffmpeg;',
		function(error, stdout, stderr) {
			if(error) {
				console.log('loading ffmpeg error');
			} else {
				console.log('loading ffmpeg');
				console.log('stdout : ' + stdout);
				console.log('stderr : ' + stderr);
				const req = https.request(options, (res) => {
					var s3 = new aws.S3();
					var temp = fs.createWriteStream('/tmp/temp.mp3');
					res.pipe(temp);

					var fileName = new Date().getTime() + '.mp3';
					if(event.fileName)
						fileName = event.fileName;
					var filePath = "/tmp/" + fileName;

					cp.exec(
						'/tmp/ffmpeg -i /tmp/temp.mp3 -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 ' + filePath,
						function(error, stdout, stderr) {
							if(error) {
								console.log('executing ffmpeg error');
							} else {
								console.log('executing ffmpeg');
								console.log('stdout : ' + stdout);
								console.log('stderr : ' + stderr);
								var file = fs.createReadStream(filePath);
								var s3param = {Bucket: 'koreantts', Key: fileName, Body: file};
								s3.upload(s3param, function(err, data) {
									if (err) console.log(err, err.stack);
									else console.log(data);
									callback(null, 'https://s3.amazonaws.com/koreantts/' + fileName);
									context.done();
								});
							}
						}
					);
				});
				req.on('error', callback);
				req.write(data);
				req.end();

			}
		}
	);

};

