var aws = require('aws-sdk');
var lambda = new aws.Lambda({
	  region: 'us-east-1'
});

var emotions = {
	"happy" : ["happy", "great", "gay", "joyous", "lucky", "fortunate", "delighted", "overjoyed", "gleeful", "thankful", "important", "festive", "ecstatic", "satisfied", "glad", "cheerful", "sunny", "merry", "elated", "jubilant", "good", "calm", "peaceful", "at ease", "comfortable", "pleased", "encouraged", "clever", "surprised", "content", "quiet", "certain", "relaxed", "serene", "free and easy", "bright", "blessed", "reassured", "open", "understanding", "confident", "reliable", "easy", "amazed", "free", "sympathetic", "interested", "satisfied", "receptive", "accepting", "kind", "alive", "playful", "courageous", "energetic", "liberated", "optimistic", "provocative", "impulsive", "free", "frisky", "animated", "spirited", "thrilled", "wonderful", "interested", "concerned", "affected", "fascinated", "intrigued", "absorbed", "inquisitive", "nosy", "snoopy", "engrossed", "curious", "positive", "eager", "keen", "earnest", "intent", "anxious", "inspired", "determined", "excited", "enthusiastic", "bold", "brave", "daring", "challenged", "optimistic", "re-enforced", "confident", "hopeful"],
	"love" : ["love", "loving", "considerate", "affectionate", "sensitive", "tender", "devoted", "attracted", "passionate", "admiration", "warm", "touched", "sympathy", "close", "loved", "comforted", "drawn toward", "afraid", "fearful", "terrified", "suspicious", "anxious", "alarmed", "panic", "nervous", "scared", "worried", "frightened", "timid", "shaky", "restless", "doubtful", "threatened", "cowardly", "quaking", "menaced", "wary", "strong", "impulsive", "free", "sure", "certain", "rebellious", "unique", "dynamic", "tenacious", "hardy", "secure"],
	"angry" : ["angry", "irritated", "enraged", "hostile", "insulting", "sore", "annoyed", "upset", "hateful", "unpleasant", "offensive", "bitter", "aggressive", "resentful", "inflamed", "provoked", "incensed", "infuriated", "cross", "worked up", "boiling", "fuming", "indignant", "confused", "upset", "doubtful", "uncertain", "indecisive", "perplexed", "embarrassed", "hesitant", "shy", "stupefied", "disillusioned", "unbelieving", "skeptical", "distrustful", "misgiving", "lost", "unsure", "uneasy", "pessimistic", "tense"],
	"sad" : ["sad", "tearful", "sorrowful", "pained", "grief", "anguish", "desolate", "desperate", "pessimistic", "unhappy", "lonely", "grieved", "mournful", "dismayed", "depressed", "lousy", "disappointed", "discouraged", "ashamed", "powerless", "diminished", "guilty", "dissatisfied", "miserable", "detestable", "repugnant", "despicable", "disgusting", "abominable", "terrible", "in despair", "sulky", "bad", "a sense of loss", "hurt", "crushed", "tormented", "deprived", "pained", "tortured", "dejected", "rejected", "injured", "offended", "afflicted", "aching", "victimized", "heartbroken", "agonized", "appalled", "humiliated", "wronged", "alienated", "helpless", "incapable", "alone", "paralyzed", "fatigued", "useless", "inferior", "vulnerable", "empty", "forced", "hesitant", "despair", "frustrated", "distressed", "woeful", "pathetic", "tragic", "in a stew", "dominated", "indifferent", "insensitive", "dull", "nonchalant", "neutral", "reserved", "weary", "bored", "preoccupied", "cold", "disinterested", "lifeless"]
};

const S3_PREFIX = 'https://s3.amazonaws.com/kpopmusic/';
var recommendations = {
	"happy" : [1913616, 1951550, 7847861, 8158031, 3853978],
	"love" : [4586092, 4433490, 1778187, 4153481, 437205], 
	"angry" : [3929469, 3894730, 2960448, 3920556, 1140592], 
	"sad" : [3620493, 8060348, 3634649, 4125620, 3647077]
};

exports.handler = function(event, context, callback) {
	var emotion = event.emotion;
	var userId = event.userId;

	var emotionCategory;
	Object.keys(emotions).forEach(function(key) { // get emotion category
		var list = emotions[key];
		if(list.indexOf(emotion) > -1) {
			emotionCategory = key;
			return true;
		} else {
		}
	});

	var songs = recommendations[emotionCategory]; // get recommendations fot emotion
	var songId = songs[Math.floor(Math.random()*songs.length)]; // get random song

	var db = new aws.DynamoDB.DocumentClient();
	var params = {
		TableName: 'kpop_playlist',
		Key : {
			userId : userId
		},
	};

	db.get(params, function(err, data) {
		if(err) {
			console.log('db updateee error :', err);
			context.done('error', err);
		}
        
		if(Object.keys(data).length === 0) { // if empty 
			var params = {
				TableName: 'kpop_playlist',
				Item : {
					userId : userId,
					songs : [{songId:songId, artistId:0}]
				},
			};
			db.put(params, function(err, data) { // create playlist
				if(err) {
					console.log('db put error :', err);
				} else {
					console.log("Put item:", data);
				}
				context.succeed(S3_PREFIX + songId+ '.mp3');
			});
		} else {
			var params = {
				TableName: 'kpop_playlist',
				Key : {
					userId : userId
				},
				UpdateExpression : "set songs = list_append(songs, :songId)",
				ExpressionAttributeValues : {
					":songId" : [{songId:songId, artistId:0}]
				}
			};

			db.update(params, function(err, data) {
				if(err) {
					console.log('db update error :', err);
				} else {
					console.log("Updated item:", data);
				}
				context.succeed(S3_PREFIX + songId+ '.mp3');
			});
		}
	});

}

//exports.handler();

