'use strict';

/**
 * Call translate and make it mp3 by TTS
 * @param text : text in ENGLISH
 * @ret : URL of MP3
 */

var aws = require('aws-sdk');
var lambda = new aws.Lambda({
	region: 'us-east-1'
});

exports.handler = (event, context, callback) => {
	var text = event.text;
	var translatePayload = {"text": text};
	lambda.invoke({
		FunctionName: 'Translate',
		Payload: JSON.stringify(translatePayload)
	}, function(error, data) {
		if(error) {
			console.log('Translate error : ' + error);
		} else {
			var translated = data.Payload;
			var ttsPayload = {"text" : translated};
			lambda.invoke({
				FunctionName: 'TTS',
				Payload: JSON.stringify(ttsPayload)
			}, function(error, data) {
				if(error) {
					console.log('TTS error : ' + error);
				} else {
					var url = data.Payload.replace(/"/gi, "");
					callback(null, url);
				}
			}
			);
		}
	});
};

