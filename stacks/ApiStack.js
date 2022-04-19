import * as sst from '@serverless-stack/resources';

export default class ApiStack extends sst.Stack {
  // Public reference to the API
  api;

  constructor(scope, id, props) {
    super(scope, id, props);

    // Create the API
    this.api = new sst.Api(this, 'Api', {
      routes: {
        'GET /schools': 'src/lambda.handler',
      },
    });

    // Show the API endpoint in the output
    this.addOutputs({
      ApiEndpoint: this.api.url,
    });
  }
}
