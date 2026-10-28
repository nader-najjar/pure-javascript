import { Container, type ContainerModule } from 'inversify';

export function createContainer(...modules: readonly ContainerModule[]): Container {
  const container = new Container({ autobind: true, defaultScope: 'Transient' });
  container.load(...modules);
  return container;
}

export function closeResources(container: Container): void {
  container.unbindAll();
}
