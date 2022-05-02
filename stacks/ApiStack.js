import * as sst from '@serverless-stack/resources';

export default class ApiStack extends sst.Stack {
  // Public reference to the API
  api;

  constructor(scope, id, props) {
    super(scope, id, props);

    const { table, schoolPicturesTable } = props;

    // Create the API
    this.api = new sst.Api(this, 'Api', {
      defaults: {
        function: {
          environment: {TABLE_NAME: table.tableName, SCHOOL_PICTURES_TABLE: schoolPicturesTable.tableName},
          permissions: [table, schoolPicturesTable],
        }
      },
      routes: {
        'GET /schools': 'src/apiDataLambda.handler',
        'GET /ipeds': 'src/ipedsLambda.handler',
        'POST /institutionalcharacteristics': 'src/insertLambda.handler',
        'POST /transform': 'src/transformLambda.handler',
        'POST /schoolPictures': 'src/insertSchoolPicturesLambda.handler'
      },
    });

    // Allow the API to access the table
    this.api.attachPermissions([table, schoolPicturesTable]);

    // Show the API endpoint in the output
    this.addOutputs({
      ApiEndpoint: this.api.url,
    });
  }
}
