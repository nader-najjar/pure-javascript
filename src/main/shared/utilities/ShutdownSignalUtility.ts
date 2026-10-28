const shutdownController = new AbortController();

export const shutdownSignal: AbortSignal = shutdownController.signal;

export function requestShutdown(reason: string): void {
  shutdownController.abort(new Error(`Shutdown requested: ${reason}`));
}
