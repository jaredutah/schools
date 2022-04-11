import ApiStack from "./ApiStack";
import FrontendStack from "./FrontendStack";

export default function main(app) {
  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: "nodejs14.x"
  });

  const apiStack = new ApiStack(app, "api");

  new FrontendStack(app, "frontend", {
    api: apiStack.api,
    });

  // Add more stacks
}
