var cheerio = require('cheerio');
var request = require('request');
var aws = require('aws-sdk');
var lambda = new aws.Lambda({
	  region: 'us-east-1'
});

exports.handler = function(event, context, callback) {
	// TODO : // get songId as parameter
	var songId = 30014276;
	var url = 'http://www.melon.com/song/detail.htm?songId=' + songId;
	request(url, function(error, response, html){ // get lyrics
		if (error) {throw error};

		var $ = cheerio.load(html, {
			decodeEntities: false
		});
		var lyrics = $(".lyric").html();
		lyrics = lyrics.replace(/<!--.*-->/gi, ""); // remove html comments
		lyrics = lyrics.replace(/\"/gi, ""); // remove double quotes
		lyrics = lyrics.replace(/<br>/gi, " "); //  remove br tags
		lyrics = lyrics.trim();

		var payload = {"text" : lyrics};
		console.log('payload', payload);

		// get TTS file of lyrics
		lambda.invoke({
			FunctionName: 'TTS',
			Payload: JSON.stringify(payload)
		}, function(error, data) {
			console.log('err :', error);
			if (error) {
				context.done('error', error);
			}

			console.log('data : ', data);
			if(data.Payload) {
				context.succeed(data)
			}
		});
	});
}

//exports.handler();
