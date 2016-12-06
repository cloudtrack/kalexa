'use strict';

/**
 * Handle Quiz
 * i) case request
 * @param userId
 * @param number : number of questions
 *
 * @ret
 * New Quiz
 *
 *
 * ii) case answer
 * @param userId
 * @param answer : True or False
 *
 * @ret
 * marking : Correct/Incorrent
 * quiz : <Empty> | New Quiz(English Sentence, Korean TTS MP3)
 */

var aws = require('aws-sdk');
var lambda = new aws.Lambda({
	region: 'us-east-1'
});

exports.handler = (event, context, callback) => {
	var userId = event.userId;
	var number = event.number;
	var answer = event.answer;

	var newQuiz = true;
	var ret = {};
	if(number !== undefined) { // request quiz
		//TODO update db - user quiz count to n-1
	} else { // answering quiz
		//TODO marking
		var lastAnswer = "True";
		if(answer == lastAnswer)
			ret.marking = "Correct";
		else
			ret.marking = "Incorrect";

		//TODO select and update db - user quiz count --
		var leftCount = 0;
		if(leftCount == 0)
			newQuiz = false;
	}

	if(newQuiz) {
		//TODO select db question

		//TODO update db user last correct answer

		var quiz = {
			"English" : "apple",
			"Korean" : "https://s3.amazonaws.com/koreantts/ff.mp3"
		};
		ret.quiz = quiz;
	}
	callback(null, JSON.stringify(ret));
};

