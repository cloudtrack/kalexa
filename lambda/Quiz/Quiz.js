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

const aws = require('aws-sdk');
const lambda = new aws.Lambda({
	region: 'us-east-1'
});
const db = new aws.DynamoDB.DocumentClient();

const DB_QUIZ_STATUS = 'quiz_status'
const DB_QUIZ_LIST = 'quiz_list'

exports.handler = (event, context, callback) => {

	var userId = event.userId;
	var number = event.number;
	var answer = event.answer;

	var ret = {};
	if(number !== undefined) { // request quiz
		var params = {
			TableName : DB_QUIZ_STATUS,
			Item : {
				"userId" : userId,
				"leftCount" : number
			}
		}
		// insert or replace
		db.put(params, function(err, data) {
			if(err)
				console.log('put user err : ' + err);

			if(number > 0)
				newQuiz(userId, ret, callback);
			else
				callback(null, JSON.stringify(ret));
		});
	} else { // answering quiz
		var params = {
			TableName : DB_QUIZ_STATUS,
			Key : {
				"userId" : userId
			}
		};
		db.get(params, function(err, data) {
			if(err)
				console.log('get user err : ' + err);

			if(answer.toLowerCase() == data.Item.lastAnswer.toString().toLowerCase())
				ret.marking = "Correct";
			else
				ret.marking = "Incorrect";

			if(data.Item.leftCount > 0)
				newQuiz(userId, ret, callback);
			else
				callback(null, JSON.stringify(ret));
		});
	}
};

function newQuiz(userId, ret, callback) {
	// decrement leftCount
	var params = {
		TableName : DB_QUIZ_STATUS,
		Key : {
			"userId" : userId
		}
	};
	var answer = Math.floor(Math.random() * 2) == 1? true : false;
	db.get(params, function(err, data) {
		if(err)
			console.log('get user in newQuiz err : ' + err);

		data.Item.leftCount--;
		data.Item.lastAnswer = answer;
		var params = {
			TableName : DB_QUIZ_STATUS,
			Item : data.Item
		};
		db.put(params, function(err, data) {
			if(err)
				console.log('decreasing leftCount err : ' + err);

			db.scan({
				TableName : DB_QUIZ_LIST
			}, function(err, data) {
				if(err)
					console.log('fetching quiz err : ' + err);

				var quizList = data.Items;
				var quizIndex = Math.floor(Math.random() * quizList.length);
				var enSentence = quizList[quizIndex].eng;
				var koNo = quizList[quizIndex].no;
				if(answer == false) {
					while(true) {
						var incorrectIndex = Math.floor(Math.random() * quizList.length);
						if(incorrectIndex != quizIndex) {
							koNo = quizList[incorrectIndex].no;
							break;
						}
					}
				}

				var quiz = {
					"English" : enSentence,
					"Korean" : 'https://s3.amazonaws.com/koreanquiz/' + koNo + '.mp3'
				};
				ret.quiz = quiz;
				callback(null, JSON.stringify(ret));
			});
		});
	});
}

