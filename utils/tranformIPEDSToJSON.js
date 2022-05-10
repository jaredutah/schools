import hd2020Data from '../data/hd2020.json';
import ic2020Data from '../data/ic2020.json';
import ic2020_ayData from '../data/ic2020_ay.json';
import ic2020_pyData from '../data/ic2020_py.json';
import adm2020Data from '../data/adm2020.json';
import c2020_aData from '../data/c2020_a.json';
import schoolsData from '../data/schools.json';

import { formatAsNumber } from './stringFunctions';
import { MongoCursorExhaustedError } from 'mongodb';

export default function () {
  const ic2020DataAsObject = ic2020Data.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const ic2020_ayDataAsObject = ic2020_ayData.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const ic2020_pyDataAsObject = ic2020_pyData.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const adm2020DataAsObject = adm2020Data.reduce((acc, curr) => ((acc[curr.UNITID] = curr), acc), {});
  const c2020_aDataAsObject = c2020_aData.reduce((acc, curr) => {
    if (!acc[curr.UNITID]) {
      acc[curr.UNITID] = {
        UNITID: formatAsNumber(curr.UNITID),
        cipcodes: [],
      };
    }

    if (curr.CIPCODE !== '99' && curr.MAJORNUM !== '2') {
      let cipCode = acc[curr.UNITID].cipcodes.find((element) => element.cipCode === curr.CIPCODE);

      if (!cipCode) {
        cipCode = { cipCode: curr.CIPCODE, awLevel: [] };
        acc[curr.UNITID].cipcodes.push(cipCode);
      }

      cipCode.awLevel.push(formatAsNumber(curr.AWLEVEL));
    }

    return acc;
  }, {});

  const schoolsDataAsObject = schoolsData.schools.reduce((acc, curr) => {
    if (curr.picture) {
      acc[curr.ipeds_id.toString()] = {
        picture: curr.picture,
        pictureWidth: curr.picture_width,
        pictureHeight: curr.picture_height,
      };
    }

    return acc;
  }, {});

  return hd2020Data.map((item) => {
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

    if (characteristicsSource) {
      characteristics = {
        religiousAffiliation: characteristicsSource.RELAFFIL !== '-2' ? formatAsNumber(characteristicsSource.RELAFFIL) : undefined,
        isDistanceLearning: characteristicsSource.DISTNCED === '1',
        isOpenPolicy: characteristicsSource.OPENADMP === '1',
        isMemberOfAthleticAssoc: characteristicsSource.ATHASSOC === '1',
        isMemberOfNCAA: characteristicsSource.ASSOC1 === '1',
        isMemberOfNAIA: characteristicsSource.ASSOC2 === '1',
        isMemberOfNJCAA: characteristicsSource.ASSOC3 === '1',
        isMemberOfNSCAA: characteristicsSource.ASSOC4 === '1',
        isMemberOfNCCAA: characteristicsSource.ASSOC5 === '1',
        IsMemberOfOther: characteristicsSource.ASSOC6 === '1',
        hasOnCampusHousing: characteristicsSource.ROOM === '1',
      };

      delete ic2020DataAsObject[item.UNITID];
    }

    const costsSource = ic2020_ayDataAsObject[item.UNITID] || ic2020_pyDataAsObject[item.UNITID];

    let costs;

    if (costsSource) {
      if (!costs) {
        costs = {};
      }

      [
        { key: 'inStateTuition', value: 'CHG2AY3' },
        { key: 'outOfStateTuition', value: 'CHG3AY3' },
        { key: 'booksAndSupplies', value: 'CHG4AY3' },
        { key: 'onCampusHousing', value: 'CHG5AY3' },
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
    if (admissionsSource) {
      admissions = {
        hasTestScoreRequirements: formatAsNumber(admissionsSource.ADMCON7),
      };

      delete adm2020DataAsObject[item.UNITID];
    }

    const completionsSource = c2020_aDataAsObject[item.UNITID];
    let completions;
    if (completionsSource) {
      completions = completionsSource.cipcodes;

      delete c2020_aDataAsObject[item.UNITID];
    }

    const schoolPicture = schoolsDataAsObject[item.UNITID];
    const picture = schoolPicture
      ? {
          name: schoolPicture?.picture,
          pictureWidth: schoolPicture?.pictureWidth,
          pictureHeight: schoolPicture?.pictureHeight,
        }
      : null;

    return {
      id: formatAsNumber(item.UNITID),
      directory,
      characteristics,
      costs,
      admissions,
      picture,
      completions,
      year: 2020,
    };
  });
}
