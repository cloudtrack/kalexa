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
var APP_ID = "amzn1.ask.skill.1edc6a40-ac35-4517-8ea5-7a8f0a5dca54"; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

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
	"LyricsIntent" : function(intent, session, response) {
	    var nth = intent.slots.Nth.value;
		var n;
		if(nth) { // get n by nth slot type
			var nth_values = [ "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
			n = nth_values.indexOf(nth);
			if(n == -1) {
				var nth_values = [ "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
				n = nth_values.indexOf(nth);
			}
		} else { // get n by amazon.number
			n = intent.slots.Number.value;
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
			console.log('dynamoDB GET', 'err : ', err, 'data : ', data);
			if(err) {
				console.log(err, err.stack);
				response.tellWithCard('Something Wrong happened');
			} else {
				var chart = data.Item.chartData;
				var song = chart[n];
				console.log(song);
				songId = song.songId;

				var payload = {"songId" : songId};
				console.log(payload);
				lambda.invoke({
					FunctionName: 'FetchLyrics',
					Payload: JSON.stringify(payload)
				}, function(error, data) {
					console.log('err :', error);
					console.log('data : ', data);
					if(data.Payload) {
						console.log(data.Payload);
						response.tellWithCard('<audio src="https://s3.amazonaws.com/koreantts/vivaldi.mp3" />');
					}
				});
			}
		});
	},
	"EmotionIntent" : function(intent, session, response) {
	    response.tellWithCard("Speech Output is this!", "this is card title", "this is card content");
	},
	"TestIntent" : function(intent, session, response) {
	    response.tellWithCard('<audio src="https://s3.amazonaws.com/koreantts/vivaldi.mp3" />');
	}
/*    "ChartIntent" : function(intent, session, response) {
		lambda.invoke({
			FunctionName: 'SpeakKpopChart',
			Payload: ""
		}, function(err, data) {
			if(err){
				console.log(err, err.stack);
				response.tellWithCard('Something Wrong happened');
			} else {
				console.log('insert new mp3 files into S3');
				var dynamodb = new aws.DynamoDB.DocumentClient();
				var params = {
					TableName: 'kpop_chart',
					Key: {
						"chart" : "realtimeChart"
					}
				};
				dynamodb.get(params, function(err, data) {
					if(err) {
						console.log(err, err.stack);
						response.tellWithCard('Something Wrong happened');
					} else {
						response.tellWithCard('I will let you know the top ten chart of K-pop songs');
						var rank = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "nineth", "tenth"];
						var chart = data.Item.chartData;
						for(var i=0; i<10; i++) {
							var songId = chart[i].songId;
							var songText = '<audio src="https://s3.amazonaws.com/koreantts/' + songId + '1.mp3" />';

							var artistsId = [];
							var artistNum = chart[i].artists.length;
							artistId[0] = chart[i].artists[0].artistId;
							var artistsText = '<audio src="https://s3.amazonaws.com/koreantts/' + artistsId[0] + '1.mp3" />';
							for(var j=1; j<artistNum; j++) {
								artistsId[j] = chart[i].artists[j].artistId;
								artistsText += 'and <audio src="https://s3.amazonaws.com/koreantts/' + artistsId[j] + '1.mp3" />';
							}

							if(artistNum == 1) {
								response.tellWithCard(rank[i] + 'song is' + songText + 'artist is' + artistsText);
							} else {
								response.tellWithCard(rank[i] + 'song is' + songText + 'artists are' + artistsText);
							}
						}
					}
				});
			}
		});
	}*/
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Kalexa skill.
    var kalexa = new Kalexa();
    kalexa.execute(event, context);
};


