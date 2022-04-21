import * as sst from '@serverless-stack/resources';

export default class ApiStack extends sst.Stack {
  // Public reference to the API
  api;

  constructor(scope, id, props) {
    super(scope, id, props);

    const { table } = props;

    console.log('the table we just got was', table.tableName)

    // Create the API
    this.api = new sst.Api(this, 'Api', {
      defaults: {
        function: {
          environment: {TABLE_NAME: table.tableName},
          permissions: [table],
        }
      },
      routes: {
        'GET /schools': 'src/apiDataLambda.handler',
        'GET /ipeds': 'src/ipedsLambda.handler',
        'POST /institutionalcharacteristics': 'src/insertLambda.handler'
      },
    });

    // Allow the API to access the table
    this.api.attachPermissions([table]);

    // Show the API endpoint in the output
    this.addOutputs({
      ApiEndpoint: this.api.url,
    });
  }
}
