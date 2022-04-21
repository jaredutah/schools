import ApiStack from './ApiStack';
import StorageStack from './StorageStack';

export default function main(app) {
  const storageStack = new StorageStack(app, "storage");

  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: 'nodejs14.x',
  });

  new ApiStack(app, 'api', {
    table: storageStack.table,
  });

  console.log('the table is', storageStack.table.tableName)

  // Add more stacks
}
