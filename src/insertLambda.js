import AWS from 'aws-sdk';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

import schoolData from '../hd2020.json';

export async function handler(event) {
  const makeEmptyString = (field) => field ?? '';
  const MAX_RECORDS = 25;
  let recordIndex = 0;

  process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;

  const requestItems = schoolData.schools.map((school) => {
    return {
      PutRequest: {
        Item: {
          unitId: makeEmptyString(school.UNITID),
          institutionName: makeEmptyString(school.INSTNM),
          alias: makeEmptyString(school.IALIAS),
          address: makeEmptyString(school.ADDR),
          city: makeEmptyString(school.CITY),
          state: makeEmptyString(school.STABBR),
          zip: makeEmptyString(school.ZIP),
          url: makeEmptyString(school.WEBADDR),
          adminUrl: makeEmptyString(school.ADMINURL),
          federalAidUrl: makeEmptyString(school.FAIDURL),
          applicationUrl: makeEmptyString(school.APPLURL),
          longitude: makeEmptyString(school.LONGITUD),
          latitude: makeEmptyString(school.LATITUDE),
        },
      },
    };
  });

  while (recordIndex <= requestItems.length) {
    const currentRequestItems = requestItems.slice(
      recordIndex,
      recordIndex + MAX_RECORDS
    );

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
