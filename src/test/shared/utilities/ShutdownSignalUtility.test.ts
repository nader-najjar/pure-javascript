import { describe, expect, it } from 'vitest';
import { requestShutdown, shutdownSignal } from '../../../main/shared/utilities/ShutdownSignalUtility.ts';

describe('ShutdownSignalUtility', () => {
  it('aborts the shared signal when shutdown is requested', () => {
    expect(shutdownSignal.aborted).toBe(false);

    requestShutdown('SIGTERM');

    expect(shutdownSignal.aborted).toBe(true);
    expect(shutdownSignal.reason).toEqual(new Error('Shutdown requested: SIGTERM'));
  });
});
