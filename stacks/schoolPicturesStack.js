import * as sst from '@serverless-stack/resources';

export default class SchoolPicturesStack extends sst.Stack {
  // Public reference to the table
  table;

  constructor(scope, id, props) {
    super(scope, id, props);

    // Create the DynamoDB table
    this.table = new sst.Table(this, 'SchoolPictures', {
      fields: {
        ipedsId: 'string',
        picture: 'string',
        pictureWidth: 'string',
        pictureHeight: 'string',
        pictureSource: 'string',
      },
      primaryIndex: { partitionKey: 'ipedsId' },
    });
  }
}
