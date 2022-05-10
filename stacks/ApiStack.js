import * as sst from '@serverless-stack/resources';

export default class ApiStack extends sst.Stack {
  // Public reference to the API
  api;

  constructor(scope, id, props) {
    super(scope, id, props);

    const { schoolPicturesTable } = props;

    // Create the API
    this.api = new sst.Api(this, 'Api', {
      defaults: {
        function: {
          environment: {SCHOOL_PICTURES_TABLE: schoolPicturesTable.tableName},
          permissions: [schoolPicturesTable],
        }
      },
      routes: {
        'POST /transformSchoolPictures': 'src/insertSchoolPicturesLambda.handler'
      },
    });

    // Allow the API to access the table
    this.api.attachPermissions([schoolPicturesTable]);

    // Show the API endpoint in the output
    this.addOutputs({
      ApiEndpoint: this.api.url,
    });
  }
}
