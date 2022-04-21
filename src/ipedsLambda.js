import AWS from 'aws-sdk';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export async function handler(event) {
  const params = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'stateIndex',
    KeyConditionExpression: '#state=:stateValue',
    ExpressionAttributeValues: { ':stateValue': 'UT' },
    ExpressionAttributeNames: { "#state": "state" }
  };

  const results = await dynamoDb.query(params).promise();

  console.log('The results are', results.Items);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({count: results.Items.length, schools: results.Items}),
  };
}
