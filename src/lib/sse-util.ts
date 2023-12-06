export const sseSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGBREAK']

/**
 * Listen for various NodeJS Signals for the purpose of best effort resource/connection cleanup.
 *
 * see: https://nodejs.org/api/process.html#process_signal_events
 */
export const handleSignals = (listener: NodeJS.SignalsListener): void =>
	sseSignals.forEach(signal => process.on(signal, listener))

/**
 * error Event from eventsource doesn't always overlap with MessageEvent
 *
 * TODO: update DefinitelyTyped https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/eventsource
 */
export type EventSourceError = MessageEvent & { status?: number; message?: string }
