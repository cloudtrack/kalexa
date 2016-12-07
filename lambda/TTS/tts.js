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

const mode = 'Naver'; 		// Google | Naver

const https = require('https');
const querystring = require('querystring');
const aws = require('aws-sdk');
const fs = require('fs');
const cp = require('child_process');

const DEFAULT_PATH = '/tmp/';

function uploadAndClean(bucketName, tempName, fileName, callback) {
	var s3 = new aws.S3();
	var file = fs.createReadStream(DEFAULT_PATH + fileName);
	var s3param = {
		Bucket: bucketName,
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
				callback(null, 'https://s3.amazonaws.com/' + bucketName + '/' + fileName);
			}
		);
	});
}

function convertMP3(bucketName, tempName, fileName, callbackAfterUpload) {
	cp.exec(
		DEFAULT_PATH + 'ffmpeg -i ' + DEFAULT_PATH + tempName
		+ ' -analyzeduration 10000000 -probesize 100000000 '
		+ ' -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 -ss 00:00:00 -t 00:01:25 '
		+ DEFAULT_PATH + fileName,
		function(error, stdout, stderr) {
			if(error) {
				console.log('retry for ffmpeg fail - error : ' + error);
				convertMP3(bucketName, tempName, fileName, callbackAfterUpload);
			} else {
				console.log('ffmpeg succeed');
				uploadAndClean(bucketName, tempName, fileName, callbackAfterUpload);
			}
		}
	);
}

exports.handler = (event, context, callback) => {
	var options_naver = {
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
	var data_naver = querystring.stringify({
		'speaker': 'mijin', // Korean, Female. (Male=jinho)
		'speed': '0', // -5x ~ 5x
		'text': event.text,
	});

	var google_param = querystring.stringify({
		'ie': 'UTF-8',
		'q': event.text,
		'tl': 'Ko-kr',
		'client': 'tw-ob',
		'idx': 0,
		'total': 1,
		'textlen': 1024
	});
	var options_google = {
		hostname: 'translate.google.com',
		port: 443,
		path: '/translate_tts?' + google_param,
		method: 'GET',
		headers: {
			'Referer': 'http://translate.google.com/',
			'User-Agent': 'stagefright/1.2 (Linux;Android 5.0)'
		}
	};
	var data_google = '';

	var options = (mode == 'Google')? options_google : options_naver;
	var data = (mode == 'Google')? data_google : data_naver;

	var tempName = 'ttstemp.mp3';
	var fileName = new Date().getTime() + '.mp3';
	var bucketName = 'koreantts';
	if(event.fileName)
		fileName = event.fileName;
	if(event.bucketName)
		bucketName = event.bucketName;

	cp.exec(
		'cp /var/task/ffmpeg ' + DEFAULT_PATH + '; chmod 755 ' + DEFAULT_PATH + 'ffmpeg; '
		+ 'ls -l ' + DEFAULT_PATH + 'ffmpeg; rm -rf ' + DEFAULT_PATH + tempName,
		function(error, stdout, stderr) {
			if(error) {
				console.log('loading ffmpeg error : ' + error);
			} else {
				console.log('loading ffmpeg succeed');
				// Naver
				const req = https.request(options, (res) => {
					console.log('TTS api returned');
					var tempFile = fs.createWriteStream(DEFAULT_PATH + tempName);
					res.pipe(tempFile);

					convertMP3(bucketName, tempName, fileName, callback);
				});
				req.on('error', callback);
				req.write(data);
				req.end();
			}
		}
	);
};

