import ApiStack from './apiStack';
import MongoApiStack from './mongoApiStack';

import SchoolPicturesStack from './schoolPicturesStack';

export default function main(app) {
  const schoolPicturesStack = new SchoolPicturesStack(app, 'schoolPicturesStorage');

  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: 'nodejs14.x',
    environment: {
      MONGODB_URI: process.env.MONGODB_URI,
    }
  });

  new ApiStack(app, 'api', {
    schoolPicturesTable: schoolPicturesStack.table
  });

  new MongoApiStack(app, 'mongoApi')
}
