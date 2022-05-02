import AWS from 'aws-sdk';

import { notNullString } from '../utils/stringFunctions';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

import schoolData from '../hd2020.json';

export async function handler(event) {
  const MAX_RECORDS = 25;
  let recordIndex = 0;

  process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;

  const requestItems = schoolData.schools.map((school) => {
    return {
      PutRequest: {
        Item: {
          unitId: notNullString(school.UNITID),
          name: notNullString(school.INSTNM),
          alias: notNullString(school.IALIAS),
          address: notNullString(school.ADDR),
          city: notNullString(school.CITY),
          state: notNullString(school.STABBR),
          zip: notNullString(school.ZIP),
          url: notNullString(school.WEBADDR),
          adminUrl: notNullString(school.ADMINURL),
          federalAidUrl: notNullString(school.FAIDURL),
          applicationUrl: notNullString(school.APPLURL),
          priceCalculatorUrl: notNullString(school.NPRICURL),
          longitude: notNullString(school.LONGITUD),
          latitude: notNullString(school.LATITUDE),
        },
      },
    };
  });

  while (recordIndex <= requestItems.length) {
    const currentRequestItems = requestItems.slice(recordIndex, recordIndex + MAX_RECORDS);

    console.log('About to write', requestItems);

    try {
      const result = await dynamoDb
        .batchWrite({
          RequestItems: {
            [process.env.TABLE_NAME]: currentRequestItems,
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
