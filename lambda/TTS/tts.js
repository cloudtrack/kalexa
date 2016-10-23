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

function uploadS3(tempName, fileName, filePath, callback) {
	var s3 = new aws.S3();
	var file = fs.createReadStream(filePath);
	var s3param = {Bucket: 'koreantts', Key: fileName, Body: file};
	s3.upload(s3param, function(err, data) {
		if (err) console.log(err, err.stack);
		else console.log(data);

		cp.exec('rm -rf /tmp/' + tempName + ' ' + filePath,
			function(error, stdout, stderr) {
				if(error)
					console.log('deleting temp error');
				else
					console.log('deleting temp ok');
				callback(null, 'https://s3.amazonaws.com/koreantts/' + fileName);
			}
		);
	});
}

exports.handler = (event, context, callback) => {
    var options = {
        hostname: 'openapi.naver.com',
        port: 443,
        path: '/v1/voice/tts.bin',
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            /*'X-Naver-Client-Id': '9NV5mB_ADv_99e3t_oey',
            'X-Naver-Client-Secret': 'jlVolLMkVy',*/
            'X-Naver-Client-Id': '2pwrCYsr_uLVHKaNajHR',
            'X-Naver-Client-Secret': 'na0qFADoLh',
        }
    };
	var data = querystring.stringify({
		'speaker': 'mijin', // Korean, Female. (Male=jinho)
		'speed': '0', // -5x ~ 5x
		'text': event.text,
	});

	var tempName = new Date().getTime() + '.mp3';
	tempName = 'testtesttest.mp3'
	cp.exec(
		'cp /var/task/ffmpeg /tmp/.; chmod 755 /tmp/ffmpeg; ls -l /tmp/ffmpeg; rm -rf /tmp/' + tempName,
		function(error, stdout, stderr) {
			if(error) {
				console.log('loading ffmpeg error');
			} else {
				console.log('loading ffmpeg');
				console.log('stdout : ' + stdout);
				console.log('stderr : ' + stderr);
				const req = https.request(options, (res) => {
					console.log('TTS api returned');
					var tempFile = fs.createWriteStream('/tmp/' + tempName);
					res.pipe(tempFile);

					var fileName = new Date().getTime() + '.mp3';
					if(event.fileName)
						fileName = event.fileName;
					var filePath = "/tmp/" + fileName;

					cp.exec(
						'/tmp/ffmpeg -analyzeduration 10000000 -probesize 100000000 -i /tmp/' + tempName + ' -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 ' + filePath,
						function(error, stdout, stderr) {
							if(error) {
								console.log('executing ffmpeg error 1');
								cp.exec(
						'/tmp/ffmpeg -analyzeduration 10000000 -probesize 100000000 -i /tmp/' + tempName + ' -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 ' + filePath,
								function(error, stdout, stderr) {
									if(error) {
										console.log('executing ffmpeg error 2');
										cp.exec(
										'/tmp/ffmpeg -analyzeduration 10000000 -probesize 100000000 -i /tmp/' + tempName + ' -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 ' + filePath,
										function(error, stdout, stderr) {
											if(error) {
												console.log('executing ffmpeg error 3');
											} else {
												uploadS3(tempName, fileName, filePath, callback);
											}
										});
									} else {
										uploadS3(tempName, fileName, filePath, callback);
									}
								});


								/*
								console.log('executing ffmpeg error : ' + error);
								cp.exec('ls -al /tmp/; rm -rf /tmp/' + tempName + ' ' + filePath,
									function(error, stdout, stderr) {
										if(error)
											console.log('deleting temp error');
										else
											console.log('deleting temp ok');
										console.log(stdout + stderr);
										callback(null, 'error');
									}
								);
								*/
							} else {
								console.log('executing ffmpeg');
								uploadS3(tempName, fileName, filePath, callback);
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

