const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
    var dynamodb = new aws.DynamoDB.DocumentClient();
    var params = {
        TableName: 'kpop_chart',
        Key: {
            'chart': 'realtimeChart'
        },
        UpdateExpression: 'set chartData = :c',
        ExpressionAttributeValues: {
            ':c': event
        },
        ReturnValues: 'UPDATED_NEW'
    };

    dynamodb.update(params, function(err, data) {
       if(err) console.log(err, err.stack);
       else{
           console.log(data);
           callback(null, event);
       }
    });
};
