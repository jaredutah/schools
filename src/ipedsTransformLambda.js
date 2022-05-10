import tranformData from '../utils/tranformIPEDSToJSON';

import { connectToDatabase } from '../utils/mongoDBConnection';

export async function handler(event, context) {
  // By default, the callback waits until the runtime event loop is empty
  // before freezing the process and returning the results to the caller.
  // Setting this property to false requests that AWS Lambda freeze the
  // process soon after the callback is invoked, even if there are events
  // in the event loop.
  context.callbackWaitsForEmptyEventLoop = false;

  // Get an instance of our database
  const db = await connectToDatabase();

  const data = tranformData();

  await db.collection('ipeds').deleteMany({});
  const result = await db.collection('ipeds').insertMany(data, { ordered: true });

  return {
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
    body: `Number of records inserted: ${JSON.stringify(result.insertedCount)}`,
  };
}
