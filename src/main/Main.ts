import 'reflect-metadata';
import { constants } from 'node:os';
import type { Container } from 'inversify';
import { awsClientsModule } from './composition/AWSClientsModule.ts';
import { closeResources, createContainer } from './composition/ContainerFactory.ts';
import { environmentModule } from './composition/EnvironmentModule.ts';
import { Executor } from './execution/Executor.ts';
import { getLogger } from './shared/utilities/LoggerUtility.ts';
import { requestShutdown } from './shared/utilities/ShutdownSignalUtility.ts';

const LOGGER = getLogger('Main');
const SHUTDOWN_GRACE_PERIOD_MS = 25_000;
const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'] as const;

let receivedSignal: NodeJS.Signals | undefined;

async function main(args: readonly string[]): Promise<void> {
  for (const signal of SHUTDOWN_SIGNALS) {
    process.once(signal, stopMain);
  }

  let exitCode = 0;
  let container: Container | undefined;
  try {
    container = createContainer(environmentModule, awsClientsModule);
    const executor = container.get(Executor);
    await executor.execute(args);
  } catch (error) {
    logFailure(error);
    exitCode = 1;
  } finally {
    closeContainerResources(container);
  }

  process.exit(receivedSignal === undefined ? exitCode : signalExitCode(receivedSignal));
}

function logFailure(error: unknown): void {
  if (receivedSignal === undefined) {
    LOGGER.error(error, 'Technical exception occurred at software entrypoint level');
  } else {
    LOGGER.info(`Stopped by shutdown request: ${String(error)}`);
  }
}

function closeContainerResources(container: Container | undefined): void {
  if (container === undefined) {
    return;
  }
  try {
    closeResources(container);
  } catch (error) {
    LOGGER.warn(error, 'Failed to close resources');
  }
}

function stopMain(signal: NodeJS.Signals): void {
  receivedSignal = signal;
  requestShutdown(signal);
  setTimeout(() => {
    LOGGER.warn(`Main did not finish within ${String(SHUTDOWN_GRACE_PERIOD_MS / 1000)}s; process will exit`);
    process.exit(signalExitCode(signal));
  }, SHUTDOWN_GRACE_PERIOD_MS).unref();
}

function signalExitCode(signal: NodeJS.Signals): number {
  return 128 + constants.signals[signal];
}

await main(process.argv.slice(2));
