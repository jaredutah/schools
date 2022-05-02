import AWS from 'aws-sdk';

import { notNullString } from '../utils/stringFunctions';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

import hd2020Data from '../hd2020.json';
import ic2020Data from '../ic2020.json';
import ic2020_ayData from '../ic2020_ay.json';
import ic2020_pyData from '../ic2020_py.json';
import adm2020Data from '../adm2020.json';
import c2020_aData from '../c2020_a.json';

const formatAsNumber = (value) => (!isNaN(value) ? Number(value) : undefined);

export async function handler() {
  const ic2020DataAsObject = ic2020Data.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const ic2020_ayDataAsObject = ic2020_ayData.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const ic2020_pyDataAsObject = ic2020_pyData.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const adm2020DataAsObject = adm2020Data.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const c2020_aDataAsObject = c2020_aData.reduce((acc, curr) => {
    if (!acc[curr.UNITID]) {
      acc[curr.UNITID] = {
        UNITID: formatAsNumber(curr.UNITID),
        cipcodes: {},
      };
    }

    if (curr.CIPCODE !== '99' && curr.MAJORNUM !== '2') {
      if (!acc[curr.UNITID].cipcodes[curr.CIPCODE]) {
        acc[curr.UNITID].cipcodes[curr.CIPCODE] = { awLevel: [] };
      }

      acc[curr.UNITID].cipcodes[curr.CIPCODE].awLevel.push(formatAsNumber(curr.AWLEVEL));
    }

    return acc;
  }, {});

  let costsNotFound = 0;
  let characteristicsNotFound = 0;
  let admissionsNotFound = 0;
  let admissionsFound = 0;
  let sampleRecord;
  let completionsNotFound = 0;
  let completionsFound = 0;

  const requestItems = hd2020Data.map((item) => {
    const directory = {
      opeId: item.OPEID,
      name: item.INSTNM,
      alias: item.IALIAS,
      address: {
        address: item.ADDR,
        city: item.CITY,
        state: item.STABBR,
        zip: item.ZIP,
        longitude: formatAsNumber(item.LONGITUD),
        latitude: formatAsNumber(item.LATITUDE),
      },
      links: {
        url: item.WEBADDR,
        adminUrl: item.ADMINURL,
        financialAidUrl: item.FAIDURL,
        applicationUrl: item.APPLURL,
        priceCalculatorUrl: item.NPRICURL,
      },
      demographics: {
        institutionType: formatAsNumber(item.CONTROL),
        fipsStateCode: formatAsNumber(item.FIPS),
        beaRegion: formatAsNumber(item.OBEREG),
        carnegieSizeSetting: formatAsNumber(item.C18SZSET),
        isHistoricallyBlack: formatAsNumber(item.HBCU),
        isTribal: formatAsNumber(item.TRIBAL),
      },
    };

    let isMulti;
    if (item.F1SYSTYP === '1') {
      isMulti = true;
      directory.multiInstitution = {
        isMulti: formatAsNumber(item.F1SYSTYP),
        name: item.F1SYSNAM,
        id: formatAsNumber(item.F1SYSCOD),
      };
    }

    const characteristicsSource = ic2020DataAsObject[item.UNITID];
    let characteristics;
    if (!characteristicsSource) {
      characteristicsNotFound++;
      //      console.log('Unable to find characteristics for', item.UNITID, item.INSTNM);
    } else {
      characteristics = {
        religiousAffiliation: characteristicsSource.RELAFFIL !== '-2' ? formatAsNumber(characteristicsSource.RELAFFIL) : undefined,
        isDistanceLearning: characteristicsSource.DISTINCED === '1',
        isOpenPolicy: characteristicsSource.OPENADMP === '1',
        isMemberOfAthleticAssoc: characteristicsSource.ATHASSOC === '1',
        isMemberOfNCAA: characteristicsSource.ASSOC1 === '1',
        isMemberOfNAIA: characteristicsSource.ASSOC2 === '1',
        isMemberOfNJCAA: characteristicsSource.ASSOC3 === '1',
        isMemberOfNSCAA: characteristicsSource.ASSOC4 === '1',
        isMemberOfNCCAA: characteristicsSource.ASSOC5 === '1',
        IsMemeberOfOther: characteristicsSource.ASSOC6 === '1',
        hasOnCampusHousing: characteristicsSource.ROOM === '1',
      };

      delete ic2020DataAsObject[item.UNITID];
    }

    const costsSource = ic2020_ayDataAsObject[item.UNITID] || ic2020_pyDataAsObject[item.UNITID];

    let costs;

    if (!costsSource) {
      costsNotFound++;
      //console.log('Unable to find costs for', item.UNITID, item.INSTNM);
    } else {
      if (!costs) {
        costs = {};
      }

      [
        { key: 'inStateTuition', value: 'CHG2AY3' },
        { key: 'outOfStateTuition', value: 'CHG2AY3' },
        { key: 'booksAndSupplies', value: 'CHG4AY3' },
        { key: 'onCampusHousing', value: 'CHG4AY3' },
        { key: 'onCampusOtherExpenses', value: 'CHG6AY3' },
        { key: 'offCampusHousing', value: 'CHG7AY3' },
        { key: 'offCampusOtherExpenses', value: 'CHG8AY3' },
      ].forEach((field) => {
        const cost = formatAsNumber(costsSource[field.value]);
        if (cost !== undefined) {
          costs[field.key] = cost;
        }
      });

      delete ic2020_ayDataAsObject[item.UNITID];
    }

    const admissionsSource = adm2020DataAsObject[item.UNITID];
    let admissions;
    if (!admissionsSource) {
      admissionsNotFound++;
    } else {
      admissionsFound++;
      admissions = {
        hasTestScoreRequirements: formatAsNumber(admissionsSource.ADMCON7),
      };

      delete adm2020DataAsObject[item.UNITID];
    }

    const completionsSource = c2020_aDataAsObject[item.UNITID];
    let completions;
    if (!completionsSource) {
      completionsNotFound++;
    } else {
      completionsFound++;
      completions = {
        cipcodes: completionsSource.cipcodes,
      };

      delete c2020_aDataAsObject[item.UNITID];
    }

    const transformedRecord = {
      id: formatAsNumber(item.UNITID),
      directory,
      characteristics,
      costs,
      admissions,
      completions,
      year: 2020,
    };

    if (
      !sampleRecord &&
      characteristics &&
      costs &&
      admissions &&
      isMulti &&
      characteristicsSource.RELAFFIL !== '-2' &&
      characteristicsSource.ATHASSOC === '1'
    ) {
      sampleRecord = transformedRecord;
    }

    return {
      PutRequest: {
        Item: transformedRecord,
      },
    };
  });

  // const MAX_RECORDS = 25;
  // let recordIndex = 0;

  // process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;

  // while (recordIndex <= requestItems.length) {
  //   const currentRequestItems = requestItems.slice(recordIndex, recordIndex + MAX_RECORDS);

  //   console.log('About to write', requestItems);

  //   try {
  //     const result = await dynamoDb
  //       .batchWrite({
  //         RequestItems: {
  //           [process.env.TABLE_NAME]: currentRequestItems,
  //         },
  //       })
  //       .promise();
  //   } catch (e) {
  //     return {
  //       statusCode: 500,
  //       body: JSON.stringify({ error: e.message }),
  //     };
  //   }

  //   recordIndex += MAX_RECORDS;
  // }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemsInserted: requestItems.length,
      characteristicsNotFound,
      costsNotFound,
      admissionsNotFound,
      admissionsFound,
      completionsNotFound,
      completionsFound,
      sampleRecord,
    }),
  };
}
