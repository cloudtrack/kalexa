/**
 * @param example
 *  event = {
 *      tableName: "tablename",
 *      key: {"key1" : "val1", "key2" : "val2", ...}
 *      updateExpression: "set column1 = :(val1), column2 = :(val2), ..."
 *      expressionAttributeValues: {':(val1)' : (newdata1), ':(val2)' : (newdata2), ...}
 *  }
 */
const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
    var dynamodb = new aws.DynamoDB.DocumentClient();

    var params = {
        TableName: event.tableName,
        Key: event.key,
        UpdateExpression: event.updateExpression,
        ExpressionAttributeValues: event.expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW'
    };

    dynamodb.update(params, function(err, data) {
       if(err) console.log(err, err.stack);
       else console.log(data);
    });
};
