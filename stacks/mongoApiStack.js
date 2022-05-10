import * as sst from '@serverless-stack/resources';

export default class ApiStack extends sst.Stack {
  // Public reference to the API
  mongoApi;

  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      defaultFunctionProps: {
        environment: {
          MONGODB_URI: process.env.MONGODB_URI,
        },
      },
      routes: {
        "GET /ipeds": "src/ipedsGetLambda.handler",
        "POST /transformData": "src/ipedsTransformLambda.handler",
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      ApiEndpoint: api.url,
    });
  }
}
