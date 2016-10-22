const cheerio = require('cheerio');
const request = require('request');
const aws = require('aws-sdk');
const lambda = new aws.Lambda({
	  region: 'us-east-1'
});

const db_table = 'kpop_lyrics';

//exports.handler();
exports.handler = function(event, context, callback) {
	var songId = event.songId;
	if(!songId) songId = 30014276; // default for test only, remove later
	
	// get url from dynamoDB
	var db = new aws.DynamoDB.DocumentClient();
	var params = {
		TableName: db_table,
		Key : {
			"songId" : songId
		}
	};

	db.get(params, function(err, data) {
		console.log('dynamoDB GET', 'err : ', err, 'data : ', data);
		console.log(data.length);
		if(err || Object.keys(data).length === 0) { // db get error occured or no saved data, then call lambda
			var url = 'http://www.melon.com/song/detail.htm?songId=' + songId;
			request(url, function(error, response, html) { // get lyrics

				var $ = cheerio.load(html, {
					decodeEntities: false
				});
				var lyrics = $(".lyric").html();
				lyrics = lyrics.replace(/<!--.*-->/gi, ""); // remove html comments
				lyrics = lyrics.replace(/\"/gi, ""); // remove double quotes
				lyrics = lyrics.replace(/<br>/gi, " "); //  remove br tags
				lyrics = lyrics.trim();

				var payload = {
					"text" : lyrics,
					"fileName" : songId + "_lyrics.mp3"
				};
				console.log('payload', payload);

				// get TTS file of lyrics
				lambda.invoke({
					FunctionName: 'TTS',
					Payload: JSON.stringify(payload)
				}, function(error, data) {
					if (error) {
						console.log('err :', error);
						context.done('error', error);
					} 
					console.log('data : ', data);
					if(data.Payload) {
						var url = data.Payload;
						var params = {
							TableName : db_table,
							Item : {
								"songId" : songId,
								"url" : url
							}
						}
						db.put(params, function(err, data) {
							if(err) {
								console.log('db put err :', err);
							} else {
								console.log("Added item:", JSON.stringify(data, null, 2));
							}
							context.succeed(url)
						});
					}
				});
			});
		} else { // get mp3 file url and return 
			var url = data.Item.url;		
			console.log('url from db : ', url);
			context.succeed(url)
		}
	});
	
}

//exports.handler();

