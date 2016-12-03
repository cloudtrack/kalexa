/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Hello World to say hello"
 *  Alexa: "Hello World!"
 */

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.ask.skill.1edc6a40-ac35-4517-8ea5-7a8f0a5dca54";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');


var aws = require('aws-sdk');
var lambda = new aws.Lambda({
	  region: 'us-east-1'
});
/**
 * Kalexa is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Kalexa = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Kalexa.prototype = Object.create(AlexaSkill.prototype);
Kalexa.prototype.constructor = Kalexa;

Kalexa.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Kalexa onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Kalexa.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Kalexa onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa Skills Kit, you can say hello";
    var repromptText = "You can say hello";
    response.ask(speechOutput, repromptText);
};

Kalexa.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Kalexa onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

Kalexa.prototype.intentHandlers = {
    // register custom intent handlers
    "KalexaIntent": function (intent, session, response) {
        response.tellWithCard("Hello World!", "Hello World", "Hello World!");
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    },
	"QuizIntent" : function(intent, session, response) {
		response.tellWithCard("Speech Output is this!", "this is card title", "this is card content");
	},
	"LyricsIntent" : function(intent, session, response) {
		var userId = session.user.userId;
		var songId;
		var async = require('async');
		async.waterfall([
			function(callback) {
				var nth = intent.slots.Nth.value;
				var number = intent.slots.number.value;
				var songId;
				if(!nth && !number) {
					console.log("get last played song");
					var dynamodb = new aws.DynamoDB.DocumentClient();
					var params = {
						TableName: 'kpop_playlist',
						Key : {
							userId : userId
						}
					};

					dynamodb.get(params, function(err, data) {
						if(err) {
							callback(err);
						} else {
							console.log('dynamo data', data);
							var songs = data.Item.songs;
							songId = songs[songs.length-1];
							callback(null, songId);
						}
					});
				} else {
					console.log("get songId by number");
					var n;
					if(nth) { // get n by nth slot type
						var nth_values = [ "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
						n = nth_values.indexOf(nth);
						if(n == -1) {
							var nth_values = [ "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
							n = nth_values.indexOf(nth);
						}
					} else { // get n by amazon.number
						n = intent.slots.number.value;
						n = n - 1;
					}

					// get songId from dynamoDB
					var dynamodb = new aws.DynamoDB.DocumentClient();
					var params = {
						TableName: 'kpop_chart',
						Key : {
							"chart" : "realtimeChart"
						}
					};
					var songId;
					dynamodb.get(params, function(err, data) {
						if(err) {
							callback(err);
						} else {
							console.log('dynamo data', data);
							var chart = data.Item.chartData;
							var song = chart[n];
							songId = song.songId;
							callback(null, songId);
						}
					});
				}
			}, function(songId, callback) { // call lambda and get url of lyrics file
				var payload = {"songId" : songId};
				console.log('lambda payload', payload);
				lambda.invoke({
					FunctionName: 'PlayLyrics',
					Payload: JSON.stringify(payload)
				}, function(err, data) {
					if(err) { // error
						callback(err);
					} else { //
						console.log('data : ', data);
						var url = data.Payload.replace(/"/gi, "");
						callback(null, url);
					}
				});
			}
		], function(err, result) { // done callback
			if(err) {
				console.log('error', err);
				response.tellWithCard('error occured');
			} else {
				console.log(result);
				var url = result;
				var speech = '<speak><audio src="' + url + '"/></speak>';
				var speechOutput = {
					type : 'SSML',
					speech : speech
				};
				response.tellWithCard(speechOutput);
			}
		});
	},
	"EmotionIntent" : function(intent, session, response) {
		var userId = session.user.userId;
		var payload = {
			"emotion" : intent.slots.Emotion.value,
			"userId" : userId
		};
	    lambda.invoke({
	        FunctionName: 'EmotionBasedRecommendation',
	        Payload: JSON.stringify(payload)

	    }, function(error, data) {
			if(error) {
				console.log('err :', error);
				response.tellWithCard('error occured');
			} else {
				console.log('data : ', data);
				if(data.Payload) {
					console.log(data.Payload);
					var url = data.Payload.replace(/"/gi, "");
					var speech = "<speak><audio src=\"" + url +  "\"/></speak>";
					var speechOutput = {
						type : 'SSML',
						speech : speech
					};
					response.tellWithCard(speechOutput);
				}
			}
        });
	},
	"TestIntent" : function(intent, session, response) {
		var mp3URL = '<speak><audio src=\"https://s3.amazonaws.com/koreantts/ff.mp3\"/></speak>';
		var speechOutput = {
			type : 'SSML',
			speech : mp3URL
		};
		response.tellWithCard(speechOutput);
	},
	"TranslateIntent" : function(intent, session, response) {
		var text = intent.slots.Sentence.value;
		var payload = {"text": text};
		lambda.invoke({
			FunctionName: 'TranslateWrapper',
			Payload: JSON.stringify(payload)
		}, function(error, data) {
			if(error) {
				console.log('TranslateIntent error : ' + error);
			} else {
				var url = data.Payload;
				var speechOutput = {
					type : 'SSML',
					speech : '<speak><audio src=' + url + ' /></speak>'
				};
				response.tellWithCard(speechOutput);
			}
		});
	},
	"ChartIntent" : function(intent, session, response) {
		var nth = intent.slots.Nth.value;
		var fromSixth = intent.slots.fromSixth.value;
		var n;
		if(nth) { // get n by nth slot type
			var nth_values = [ "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
			n = nth_values.indexOf(nth);
			if(n == -1) {
				var nth_values = [ "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
				n = nth_values.indexOf(nth);
			}
		}
		lambda.invoke({
			FunctionName: 'SpeakKpopChart',
			Payload: ''
		}, function(err, data) {
			if(err){
				console.log(err, err.stack);
				response.tellWithCard('Something Wrong happened');
			} else {
				console.log('complete to upload new mp3 files into S3');
				var chart = JSON.parse(data.Payload);
				var rank = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
				if(fromSixth){
					console.log('from sixth');
					var speechOutput = '<speak>I will let you know sixth to tenth rank of K-pop songs.';
					var rank = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
					for(var i=5; i<10; i++) {
						var songId = chart[i].songId;
						var url = "https://s3.amazonaws.com/koreantts/" + songId + "1.mp3";
						var songText = "<audio src=\"" + url + "\"/>";
						speechOutput += ' ' + rank[i] + ' song is ' + songText;
					}
					speechOutput += '. if you want to know the artist of the song, say like who is first song\'s artist</speak>'
					response.tellWithCard({type: 'SSML', speech: speechOutput});
				}
				else if(!nth){
					console.log('first to fifth');
					var speechOutput = '<speak>I will let you know first to fifth rank of K-pop songs.';
					for(var i=0; i<5; i++) {
						var songId = chart[i].songId;
						var url = "https://s3.amazonaws.com/koreantts/" + songId + "1.mp3";
						var songText = "<audio src=\"" + url + "\"/>";
						speechOutput += ' ' + rank[i] + ' song is ' + songText;
					}
					speechOutput += '. if you want to know sixth to tenth rank of songs, say like let me know chart from sixth rank</speak>'
					response.tellWithCard({type: 'SSML', speech: speechOutput});
				}
				else{
					console.log('speak artist');
					var speechOutput = '<speak>I will let you know artist of ' + rank[n] + ' placed song. ';
					var songId = chart[n].songId;
					var url = "https://s3.amazonaws.com/koreantts/" + songId + "1.mp3";
					var songText = "<audio src=\"" + url + "\"/>";
					speechOutput += 'name of song is ' + songText;

					var artistNum = chart[n].artists.length;
					if(artistNum == 1){
						var artistId = chart[n].artists[0].artistId;
						var url = "https://s3.amazonaws.com/koreantts/" + artistId + "1.mp3";
						var artistText = "<audio src=\"" + url + "\"/>";
						speechOutput += ' artist is ' + artistText;
					} else {
						var artistId = chart[n].artists[0].artistId;
						var url = "https://s3.amazonaws.com/koreantts/" + artistId + "1.mp3";
						var artistText = "<audio src=\"" + url + "\"/>";
						speechOutput += ' artists are ' + artistText;
						for(var j=1; j<artistNum; j++) {
							artistsId = chart[n].artists[j].artistId;
							var url = "https://s3.amazonaws.com/koreantts/" + artistId + "1.mp3";
							var artistText = "<audio src=\"" + url + "\"/>";
							speechOutput += ' and ' + artistText;
						}
					}
					speechOutput += '</speak>'
					response.tellWithCard({type: 'SSML', speech: speechOutput});
				}
			}
		});
	},
	"OtherSongIntent" : function(intent, session, response) {
		var nth = intent.slots.Nth.value;
		var n;
		if(nth) { // get n by nth slot type
			var nth_values = [ "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
			n = nth_values.indexOf(nth);
			if(n == -1) {
				var nth_values = [ "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
				n = nth_values.indexOf(nth);
			}
		}
		var payload = {nth : n};
	    lambda.invoke({
    		FunctionName: 'ArtistBasedRecommendation',
    		Payload: JSON.stringify(payload)
    	}, function(err, data) {
			if(err){
    			console.log(err, err.stack);
	    		response.tellWithCard('Something Wrong happened');
			} else {
				console.log('complete to upload new mp3 files into S3');
    			var songs = JSON.parse(data.Payload);
    		    var rank = ["first", "second", "third", "fourth", "fifth"];
				var songsNum = songs.length;
				var speechOutput = '';
				var artistId = songs[0].artistId;
				var url = "https://s3.amazonaws.com/koreantts/" + artistId + "1.mp3";
				var artistText = "<audio src=\"" + url + "\"/>";

				if(songsNum == 0){
					speechOutput = '<speak>there isn\'t any other song of the artist ' + artistText + '</speak>';
					response.tellWithCard({type: 'SSML', speech: speechOutput});
				} else {
		        	speechOutput = '<speak>I recommend some songs of singer ' + artistText;
					for(var i=0; i<songsNum; i++) {
						var songId = songs[i].songId;
						var url = "https://s3.amazonaws.com/koreantts/" + songId + "1.mp3";
						var songText = "<audio src=\"" + url + "\"/>";
						speechOutput += ' ' + rank[i] + ' song is ' + songText;
					}
	    			speechOutput += '</speak>';
		    		response.tellWithCard({type: 'SSML', speech: speechOutput});
				}
			}
	    });
	},
	"PlaySongIntent" : function(intent, session, response) {
        var nth = intent.slots.Nth.value;
        var notInChart = intent.slots.NotinChart.value;
        var dynamodb = new aws.DynamoDB.DocumentClient();

		if(nth) {
			var nth_values = [ "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
			var n = nth_values.indexOf(nth);
			if(n == -1) {
				var nth_values = [ "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
				n = nth_values.indexOf(nth);
			}
            var params = {
                TableName: 'kpop_chart',
                Key : {
                    "chart" : "realtimeChart"
                }
            };
            dynamodb.get(params, function(err, data) {
                console.log('dynamoDB GET', 'err : ', err, 'data : ', data);
                if(err) {
                    console.log(err, err.stack);
                    response.tellWithCard('Error occured');
                } else {
                    var chart = data.Item.chartData;
					var song = chart[n];
					var songId = song.songId;
					if(!notInChart){//play song in the chart
						var params = {
							TableName: 'kpop_songs',
							Key : {
								type : 'latest'
							},
							UpdateExpression : "set songId = :songId",
							ExpressionAttributeValues : {
								":songId" : songId
							}
						};
						dynamodb.update(params, function(err, data) {
							if(err) {
								console.log('db update error :', err);
								response.tellWithCard('Error occured');
							} else {
								var url = "https://s3.amazonaws.com/kpopmusic/" + songId + ".mp3";
								var songText = "<speak><audio src=\"" + url + "\"/></speak>";
								response.tellWithCard({type: 'SSML', speech: songText});
							}
						});
					}
					else{//play song not in the chart, the song is other song of artist in the chart
						var payload = {
			                artistId: song.artists[0].artistId,
			                artistName: song.artists[0].artistName,
			                songId: song.songId
			            };
						lambda.invoke({
			                FunctionName: 'GetOtherSongs',
			                Payload: JSON.stringify(payload)
			            }, function(err, data) {
			                if(err) console.log(err, err.stack);
			                else {
								var songs = JSON.parse(data.Payload);
								var songId = songs[0].songId;
								var params = {
									TableName: 'kpop_songs',
									Key : {
										type : 'latest'
									},
									UpdateExpression : "set songId = :songId",
									ExpressionAttributeValues : {
										":songId" : songId
									}
								};
								dynamodb.update(params, function(err, data) {
									if(err) {
										console.log('db update error :', err);
										response.tellWithCard('Error occured');
									} else {
										var url = "https://s3.amazonaws.com/kpopmusic/" + songId + ".mp3";
										var songText = "<speak><audio src=\"" + url + "\"/></speak>";
										response.tellWithCard({type: 'SSML', speech: songText});
									}
								});
			                }
						});
                	}
				}
            });
		}
	},
	"CollaborationFilteringIntent" : function(intent, session, response) {
		var userId = session.user.userId;
		var payload = {
			"userId" : userId
		};
	    lambda.invoke({
	        FunctionName: 'CollaborationFilteringIntent',
	        Payload: JSON.stringify(payload)
	    }, function(error, data) {
			if(error) {
				console.log('err :', error);
				response.tellWithCard('error occured');
			} else {
				console.log('data : ', data);
				if(data.Payload) {
					console.log(data.Payload);
					var url = data.Payload.replace(/"/gi, "");
					var speech = "<speak><audio src=\"" + url +  "\"/></speak>";
					var speechOutput = {
						type : 'SSML',
						speech : speech
					};
					response.tellWithCard(speechOutput);
				}
			}
        });
	}
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Kalexa skill.
    var kalexa = new Kalexa();
    kalexa.execute(event, context);
};
