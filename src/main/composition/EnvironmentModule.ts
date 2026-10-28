import { ContainerModule } from 'inversify';
import { createEnvironmentVariables } from '../environment/EnvironmentVariablesFactory.ts';
import { ENVIRONMENT_VARIABLES, type EnvironmentVariables } from '../environment/models/EnvironmentVariables.ts';

export const environmentModule = new ContainerModule(({ bind }) => {
  bind<EnvironmentVariables>(ENVIRONMENT_VARIABLES)
    .toDynamicValue(() => createEnvironmentVariables(process.env))
    .inSingletonScope();
});
