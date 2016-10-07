'use strict';

/**
 * @param text : English string to translate
 * @return translated Korean string (by Naver translate API)
 */

const https = require('https');
const querystring = require('querystring');
/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */
exports.handler = (event, context, callback) => {
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
};

