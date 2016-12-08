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
	[4, "Do not underestimate me.", "저를 과소평가하지 마십시오"],
	[5, "Was this intentional?", "이것이 의도적이었습니까?"],
	[6, "I am tring to understand.", "이해하려고 노력 중입니다."],
	[7, "Are you done with the report?", "레포트 다 썼어요?"],
	[8, "I can't believe you did that.", "당신이 그렇게 했다는 것을 믿을 수 없습니다."],
	[9, "Is it okay if I spend the night?", "밤 새고 와도 괜찮아요?"],
	[10, "Why don't you look for a job?", "직장을 찾아보는 게 어때요?"],
	[11, "I am calling to make a reservation.", "예약하려고 전화했습니다."],
	[12, "Can you give me a chance?", "한 번 기회를 주실 수 있습니까?"],
	[13, "That is what I heard.", "그것이 제가 들은 것입니다."],
	[14, "All I need is some rest.", "제게 필요한 건 휴식뿐입니다."],
	[15, "I think I might have the answer.", "저에게 답이 있을 거예요."],
	[16, "What do you think of my boyfriend?", "제 남자친구를 어떻게 생각하십니까?"],
	[17, "Where can I park my car?", "제 차를 어디에 주차할 수 있나요?"],
	[18, "My favorite movie is the Inception.", "제가 가장 좋아하는 영화는 인셉션입니다."],
	[19, "I am ready to go out.", "저는 나갈 준비가 됐어요."],
	[20, "Please take me with you.", "제발 저를 데리고 가세요."],
	[21, "You seem to be angry.", "당신은 화난 것 같네요."],
	[22, "That's not possible.", "그것은 불가능합니다."],
	[23, "Take your time, please.", "천천히 하세요."],
	[24, "How long is the delay?", "얼마나 연착됩니까?"],
	[25, "There is nothing to be afraid of.", "무서워 할 건 아무것도 없어요."]
];
