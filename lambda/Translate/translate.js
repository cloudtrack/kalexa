'use strict';

/**
 * Translate English to Korean, using Naver API
 * @param text : English string to translate
 * @return translated Korean string
 */

const https = require('https');
const querystring = require('querystring');
const googleTranslate = require('google-translate')('AIzaSyDfzENB3DX62v8wc0duBep5EhfJ7S63xWU');

exports.handler = (event, context, callback) => {
	// Google Cloud Translate API
	googleTranslate.translate(event.text, 'en', 'ko', function(err, translation) {
		console.log('Google translated : ' + translation.translatedText);
		callback(null, translation.translatedText);
	});

	// Naver Translate API
	/*
	var options = {
        hostname: 'openapi.naver.com',
        port: 443,
        path: '/v1/language/translate',
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Naver-Client-Id': '9NV5mB_ADv_99e3t_oey',
            'X-Naver-Client-Secret': 'jlVolLMkVy',
        }
    };
    var data = querystring.stringify({
        'source': 'en',
        'target': 'ko',
        'text': event.text,
    });
    const req = https.request(options, (res) => {
        let body = '';
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Successfully processed HTTPS response');
            body = JSON.parse(body);
            var trans = body.message.result.translatedText;
            callback(null, trans);
        });
    });
    req.on('error', callback);
    req.write(data);
	req.end();
	*/
};

