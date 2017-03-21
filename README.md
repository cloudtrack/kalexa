## Overview
This is the Alexa Skill for Amazon Echo with as following features. 
* Learning Korean - translation and quiz from English to Korean
* K-POP Music - lyrics and playing songs of KPOP chart information
* My Favorite Music - emotion based user based recommendation based on pre-defined set for emotion based 
* Collaborative filtering, recent and popular playlist 

## Architecture 
It used AWS Lambda, Google Translate API, Naver Text to Speech API, Melon API and ffmpeg technology. 

## Features 
You can ask as following questions.
* Alexa, Translate XXX into Korean
* Alexa, I want to know popular K-POP songs
* Alexa, Play nth song in the chart
* Alexa, Let me know other song of nth artist
* Alexa, I feel sad
* Alexa, Recommend me any song
* Alexa, Give me n Korean quizzes
* Alexa, Tell me the lyrics of nth song

## Performance
We improved some of performances
* Latency in API calls: Reduce calls, Dummy worker, Caching
* Lambda Initialization: User library tuning to Amazon Linux
* Lambda Execution: efficient code, MP3 caching and using Redis – In-memory Cache
