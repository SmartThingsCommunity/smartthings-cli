import { Configuration as LoggingConfig } from 'log4js'

import { buildMockLogger } from '../__tests__/test-lib/mock-logger'


export class LogManager {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	init(config: LoggingConfig): void {
		// nothing to do
	}

	getLogger = jest.fn().mockReturnValue(buildMockLogger('trace'))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function defaultLoggingConfig(filename: string): LoggingConfig {
	return { appenders: {}, categories: {} }
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function loadLoggingConfig(configFilename: string, defaultConfig: LoggingConfig): LoggingConfig {
	return { appenders: {}, categories: {} }
}

if (!('_logManager' in (global as { _logManager?: LogManager }))) {
	(global as { _logManager?: LogManager })._logManager = new LogManager()
}

export const logManager: LogManager = (global as unknown as { _logManager: LogManager })._logManager
