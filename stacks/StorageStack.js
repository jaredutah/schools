import * as sst from '@serverless-stack/resources';

export default class StorageStack extends sst.Stack {
  // Public reference to the table
  table;

  constructor(scope, id, props) {
    super(scope, id, props);

    // Create the DynamoDB table
    this.table = new sst.Table(this, 'InstitutionalCharacteristics', {
      fields: {
        unitId: 'string',
        institutionName: 'string',
        alias: 'string',
        address: 'string',
        city: 'string',
        state: 'string',
        zip: 'string',
        url: 'string',
        adminUrl: 'string',
        federalAidUrl: 'string',
        applicationUrl: 'string',
        longitude: 'string',
        latitude: 'string',
      },
      primaryIndex: { partitionKey: 'unitId' },
      globalIndexes: {
        stateIndex: { partitionKey: 'state' },
      },
    });
  }
}
