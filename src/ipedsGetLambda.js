import { connectToDatabase } from '../utils/mongoDBConnection';
import { formatAsNumber } from '../utils/stringFunctions';
import axios from 'axios';

export async function handler(event, context) {
  // By default, the callback waits until the runtime event loop is empty
  // before freezing the process and returning the results to the caller.
  // Setting this property to false requests that AWS Lambda freeze the
  // process soon after the callback is invoked, even if there are events
  // in the event loop.
  context.callbackWaitsForEmptyEventLoop = false;

  // Get an instance of our database
  const db = await connectToDatabase();

  const queryStringParameters = event.queryStringParameters;

  console.log('queryStringParameters', queryStringParameters);

  const params = [];
  let limit = 25;
  let skip = 0;

  const match = {};

  if (queryStringParameters) {
    if (queryStringParameters.name) {
      match['directory.name'] = { $regex: queryStringParameters.name, $options: 'i' };
    }

    if (queryStringParameters.city) {
      match['directory.address.city'] = { $regex: queryStringParameters.city, $options: 'i' };
    }

    if (queryStringParameters.state) {
      match['directory.address.state'] = queryStringParameters.state;
    }

    if (queryStringParameters.zip) {
      match['directory.address.zip'] = { $regex: queryStringParameters.zip, $options: 'i' };
    }

    if (queryStringParameters.religiousAffiliation) {
      match['characteristics.religiousAffiliation'] = formatAsNumber(queryStringParameters.religiousAffiliation);
    }

    if (queryStringParameters.isHistoricallyBlack) {
      match['directory.demographics.isHistoricallyBlack'] = formatAsNumber(queryStringParameters.isHistoricallyBlack);
    }

    if (queryStringParameters.isTribal) {
      match['directory.demographics.isTribal'] = formatAsNumber(queryStringParameters.isTribal);
    }

    if (queryStringParameters.region) {
      match['directory.demographics.beaRegion'] = formatAsNumber(queryStringParameters.region);
    }

    if (queryStringParameters.schoolSize) {
      match['directory.demographics.carnegieSizeSetting'] = formatAsNumber(queryStringParameters.schoolSize);
    }

    if (queryStringParameters.institutionType) {
      const options = [formatAsNumber(queryStringParameters.institutionType)];

      if (queryStringParameters.institutionType === '2') {
        options.push(3);
      }

      match['directory.demographics.institutionType'] = { $in: options };
    }

    if (queryStringParameters.cipCodeCategory) {
      const pattern = `${queryStringParameters.cipCodeCategory}.*`;
      match[completions] = { $elemMatch: { cipCode: new RegExp(pattern) } };
    }

    if (queryStringParameters.cipCode) {
      const cipCodeFilter = { cipCode: queryStringParameters.cipCode };

      if (queryStringParameters.awardLevel) {
        cipCodeFilter.awLevel = formatAsNumber(queryStringParameters.awardLevel);
      }

      match[completions] = { $elemMatch: cipCodeFilter };
    }

    if (queryStringParameters.isDistanceLearning) {
      match['characteristics.isDistanceLearning'] = queryStringParameters.isDistanceLearning === '1';
    }

    if (queryStringParameters.limit) {
      limit = formatAsNumber(queryStringParameters.limit);
    }

    if (queryStringParameters.skip) {
      skip = formatAsNumber(queryStringParameters.skip);
    }
  }

  // Make a MongoDB MQL Query
  let start = Date.now();

  let findParameters = params.length > 0 ? { $and: params } : null;

  //  const schools = await db.collection('ipeds').find(findParameters).sort({ 'directory.name': 1 }).skip(skip).limit(limit).toArray();

  const cursor = db.collection('ipeds').aggregate([
    {
      $match: match,
    },
    {
      $facet: {
        schools: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
          {
            $sort: { 'directory.name': 1 },
          },
        ],
        count: [{ $count: 'total' }],
      },
    },
  ]);

  let schools;
  let totalCount;
  await cursor.forEach((results, someRandomArg) => {
    schools = results.schools;
    totalCount = results.count[0].total;
  });

  console.log('query took', Date.now() - start, 'milliseconds', JSON.stringify(params));

  // const schoolNames = data.map((school) => encodeURIComponent(school.directory.name));

  // const schoolDescriptions = await axios.get(
  //   `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&converttitles=false&titles=${schoolNames.join('|')}`
  // );

  // console.log(schoolDescriptions.data.query.pages)

  // const descriptions = schoolDescriptions.data.query.pages;

  // const schoolsWithNames = [];

  // Object.keys(descriptions).map((key) => {
  //   schoolsWithNames.push({
  //     title: descriptions[key].title,
  //     extract: descriptions[key].extract,
  //
  //

  // console.log(schoolsWithNames.map((school) => school.title));

  // const schools = data.map((school) => {
  //   const entry = schoolsWithNames.find((schoolWithExtract) => schoolWithExtract.title === school.directory.name);
  //   if (entry) {
  //     school.description = entry.extract;
  //   }

  //   return school;
  //

  const results = await Promise.all(
    schools.map(async (item) => {
      const wikipediaResults = await axios.get(
        `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(
          item.directory.name
        )}`
      );
      const description = Object.values(wikipediaResults.data.query.pages)[0].extract;

      if (description) {
        item.description = description;
      }

      return item;
    })
  );

  const body = JSON.stringify({ totalCount, skip, limit, schools });

  return {
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
    body,
  };
}
