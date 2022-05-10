import AWS from 'aws-sdk';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export async function handler(event) {
  const queryStringParameters = event.queryStringParameters;

  console.log('queryStringParameters', queryStringParameters);

  const params = {
    TableName: process.env.TABLE_NAME,
  };

  let results;
  if (queryStringParameters && queryStringParameters['school.state']) {
    params.IndexName = 'stateIndex';
    params.KeyConditionExpression = '#state=:stateValue';
    params.ExpressionAttributeValues = { ':stateValue': queryStringParameters['school.state'] };
    params.ExpressionAttributeNames = { '#state': 'state' };
    results = await dynamoDb.query(params).promise();
  } else {
    results = await dynamoDb.get(params).promise();
  }

  const schools = results.Items;

  // const URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

  // const params = Object.assign(event.queryStringParameters, {
  //   api_key: 'TOzd6H2m6vIGdpERhHv7Zbnd6FIQ6f6Cohy2bT5V',
  // });

  // const response = await axios.get(URL, {
  //   params,
  // });

  // const schools = response.data.results;

  const ipedsIds = {};

  schools.forEach((school, i) => {
    ipedsIds[`:ipedsId${i}`] = school.unitId;
  });

  // These hold FilterExpression attribute aliases
  const ipedsIdx = Object.keys(ipedsIds);

  //retrive records from SchoolPictures table
  const schoolPictureParams = {
    TableName: process.env.SCHOOL_PICTURES_TABLE,
    FilterExpression: `ipedsId IN (${ipedsIdx})`,
    ExpressionAttributeValues: { ...ipedsIds },
  };

  const schoolPicturesResults = await dynamoDb.scan(schoolPictureParams).promise();

  const combinedJSON = schools.map((school) => {
    const schoolPicture = schoolPicturesResults.Items.find((schoolPicture) => schoolPicture.ipedsId === `${school.unitId}`);
    return Object.assign(school, schoolPicture);
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: combinedJSON.length, schools: combinedJSON }),
  };
}
