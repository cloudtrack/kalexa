/**
 * @param example
 *  event = {
 *      tableName: "tablename",
 *      item: {"key1" : "val1", "key2" : "val2", ..., "column1": (data1), ...}
 *  }
 */
const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
    var dynamodb = new aws.DynamoDB.DocumentClient();

    var params = {
        TableName: event.tableName,
        Item: event.item
    };

    dynamodb.put(params, function(err, data) {
       if(err) console.log(err, err.stack);
       else console.log(data);
    });
};
