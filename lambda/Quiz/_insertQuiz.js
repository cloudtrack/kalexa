'use strict';

/**
 * this is ONE-TIME quiz inserter
 *
 * insert hardcoded quiz to DB, and upload korean TTS to S3
 */

const aws = require('aws-sdk');
const lambda = new aws.Lambda({
	region: 'us-east-1'
});
const db = new aws.DynamoDB.DocumentClient();

const DB_QUIZ_LIST = 'quiz_list'

exports.handler = (event, context, callback) => {
	Promise.all(QUIZ_LIST.map(insertQuiz)).then(allData => {
		callback(null, "OK");
	});
}

function insertQuiz(quiz) {
	return new Promise(function(resolve, reject) {
		var params = {
			TableName : DB_QUIZ_LIST,
			Item : {
				"no" : quiz[0],
				"eng" : quiz[1]
			}
		};
		db.put(params, function(err, data) {
			if(err)
				console.log('put quiz err : ' + err);

			var payload = {
				'text' : quiz[2],
				'fileName' : quiz[0] + '.mp3',
				'bucketName' : 'koreanquiz'
			};

			lambda.invoke({
				FunctionName : 'TTS',
				Payload : JSON.stringify(payload)
			}, function(err, data) {
				if(err)
					console.log('TTS API err : ' + err);

				return resolve();
			});
		});
	});
}

var QUIZ_LIST = [
	[1, "What is your name?", "당신의 이름은 무엇입니까?"],
	[2, "I am a student.", "저는 학생입니다."],
	[3, "Help me, please.", "도와주세요."],
	[4, "Do not underestimate me", "저를 과소평가하지 마십시오"],
	[5, "Was this intentional?", "이것이 의도적이었습니까?"]
];
