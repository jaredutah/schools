import AWS from 'aws-sdk';
import { notNullString } from '../utils/stringFunctions';
import schoolData from '../data/schools.json';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export async function handler(event) {
  const MAX_RECORDS = 25;
  let recordIndex = 0;

  process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;

  const requestItems = schoolData.schools.map((school) => {
    return {
      PutRequest: {
        Item: {
          ipedsId: notNullString(school.ipeds_id),
          picture: notNullString(school.picture),
          pictureWidth: notNullString(school.picture_width),
          pictureHeight: notNullString(school.picture_height),
          picturesSource: notNullString(school.picture_source),
        },
      },
    };
  });

  while (recordIndex <= requestItems.length) {
    const currentRequestItems = requestItems.slice(recordIndex, recordIndex + MAX_RECORDS);

    try {

      console.log('inserting into', process.env.SCHOOL_PICTURES_TABLE, JSON.stringify(currentRequestItems));

      const result = await dynamoDb
        .batchWrite({
          RequestItems: {
            [process.env.SCHOOL_PICTURES_TABLE]: currentRequestItems,
          },
        })
        .promise();
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: e.message }),
      };
    }

    recordIndex += MAX_RECORDS;
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: requestItems.length + ' items inserted.',
  };
}
