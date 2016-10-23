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

const DEFAULT_PATH = '/tmp/';

function uploadAndClean(tempName, fileName, callback) {
	var s3 = new aws.S3();
	var file = fs.createReadStream(DEFAULT_PATH + fileName);
	var s3param = {
		Bucket: 'koreantts',
		Key: fileName,
		Body: file,
		ACL: 'public-read'
	};
	s3.upload(s3param, function(err, data) {
		if (err) console.log('S3 upload error : ' + err, err.stack);
		else console.log('S3 upload succeed : ' + data);

		cp.exec('rm -rf ' + DEFAULT_PATH  + tempName + ' ' + DEFAULT_PATH + fileName,
			function(error, stdout, stderr) {
				if(error)
					console.log('deleting temp error : ' + error);
				else
					console.log('deleting temp succeed');
				callback(null, 'https://s3.amazonaws.com/koreantts/' + fileName);
			}
		);
	});
}

function convertMP3(tempName, fileName, callbackAfterUpload) {
	cp.exec(
		DEFAULT_PATH + 'ffmpeg -i ' + DEFAULT_PATH + tempName
		+ ' -analyzeduration 10000000 -probesize 100000000 '
		+ ' -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 -ss 00:00:00 -t 00:01:25 '
		+ DEFAULT_PATH + fileName,
		function(error, stdout, stderr) {
			if(error) {
				console.log('executing ffmpeg error : RETRY');
				convertMP3(tempName, fileName, callbackAfterUpload);
			} else {
				console.log('executing ffmpeg');
				uploadAndClean(tempName, fileName, callbackAfterUpload);
			}
		}
	);
}

exports.handler = (event, context, callback) => {
	var options = {
		hostname: 'openapi.naver.com',
		port: 443,
		path: '/v1/voice/tts.bin',
		method: 'post',
		headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            //'X-Naver-Client-Id': '9NV5mB_ADv_99e3t_oey', 		// yeongjin
            //'X-Naver-Client-Secret': 'jlVolLMkVy',
            'X-Naver-Client-Id': '2pwrCYsr_uLVHKaNajHR', 		// sanghoon
            'X-Naver-Client-Secret': 'na0qFADoLh',
        }
    };
	var data = querystring.stringify({
		'speaker': 'mijin', // Korean, Female. (Male=jinho)
		'speed': '0', // -5x ~ 5x
		'text': event.text,
	});

	var tempName = new Date().getTime() + '.mp3';
	cp.exec(
		'cp /var/task/ffmpeg ' + DEFAULT_PATH + '; chmod 755 ' + DEFAULT_PATH + 'ffmpeg; '
		+ 'ls -l ' + DEFAULT_PATH + 'ffmpeg; rm -rf ' + DEFAULT_PATH + tempName,
		function(error, stdout, stderr) {
			if(error) {
				console.log('loading ffmpeg error : ' + error);
			} else {
				console.log('loading ffmpeg succeed');
				//console.log('stdout : ' + stdout);
				//console.log('stderr : ' + stderr);
				const req = https.request(options, (res) => {
					console.log('TTS api returned');
					var tempFile = fs.createWriteStream(DEFAULT_PATH + tempName);
					res.pipe(tempFile);

					var fileName = new Date().getTime() + '.mp3';
					if(event.fileName)
						fileName = event.fileName;

					convertMP3(tempName, fileName, callback);
				});
				req.on('error', callback);
				req.write(data);
				req.end();
			}
		}
	);
};

