'use strict';

/**
 * Make an MP3 file reading text which was given by param,
 * Using Naver TTS API
 * @param text : Korean string to read
 * @return the URL of an MP3 file
 *
 * MP3 file is saved in S3
 */

const https = require('https');
const querystring = require('querystring');
const aws = require('aws-sdk');
const fs = require('fs');

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
    const req = https.request(options, (res) => {
		/* there is no example upload res to s3 directly
		 * using example https code didn't work. body is different from mp3
		 * I tried download using res.pipe(fs.createWriteStream ... )
		 * saving it to /tmp/, reading it again, and uploading to S3 works.
		 * but simply to toss res to s3 works.
		 */

        /*let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Successfully processed HTTPS response');
			var s3 = new aws.S3();
			var s3param = {Bucket: 'koreantts', Key: 'test.mp3', Body: body};
			s3.upload(s3param, function(err, data) {
				if (err) console.log(err, err.stack);
				else console.log(data);
				callback(null, "dd");
				context.done();
			});
		});
		*/
		var s3 = new aws.S3();
		var fileName = new Date().getTime() + '.mp3';
		var s3param = {Bucket: 'koreantts', Key: fileName, Body: res};
			s3.upload(s3param, function(err, data) {
				if (err) console.log(err, err.stack);
				else console.log(data);
				callback(null, 'https://s3.amazonaws.com/koreantts/' + fileName);
				context.done();
			});

    });
    req.on('error', callback);
    req.write(data);
	req.end();

};

