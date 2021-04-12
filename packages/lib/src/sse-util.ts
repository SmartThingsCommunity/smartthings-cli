export const sseSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGBREAK']

/**
 * Listen for various NodeJS Signals for the purpose of best effort resource/connection cleanup.
 *
 * see: https://nodejs.org/api/process.html#process_signal_events
 */
export function handleSignals(listener: NodeJS.SignalsListener): void {
	sseSignals.forEach(signal => process.on(signal, listener))
}
