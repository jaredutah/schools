import ApiStack from './ApiStack';
import StorageStack from './StorageStack';
import SchoolPicturesStack from './schoolPicturesStack';

export default function main(app) {
  const storageStack = new StorageStack(app, "storage");
  const schoolPicturesStack = new SchoolPicturesStack(app, 'schoolPicturesStorage');

  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: 'nodejs14.x',
  });

  new ApiStack(app, 'api', {
    table: storageStack.table,
    schoolPicturesTable: schoolPicturesStack.table
  });

  console.log('the table is', storageStack.table.tableName)
  console.log('the schoolPicturesTable is', schoolPicturesStack.table.tableName)

  // Add more stacks
}
