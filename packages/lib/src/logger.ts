import fs from 'fs'
import yaml from 'js-yaml'
import { configure, Configuration as LoggingConfig, Logger, Level, FileAppender, StandardErrorAppender, LogLevelFilterAppender } from 'log4js'

import { Logger as APILogger } from '@smartthings/core-sdk'
import { yamlExists } from './io-util'


const DEFAULT_LOG_FILE_SIZE = 1_000_000 // bytes
const LOGGING_DOCS_URL = 'https://github.com/SmartThingsCommunity/smartthings-cli/' +
	'blob/master/packages/cli/doc/configuration.md#logging'

class Log4JSLogger implements APILogger {
	constructor(private logger: Logger) {
	}

	get level(): string {
		// TODO: fixed in log4js >= 6.4.0
		// The types are defined for log4js don't match up with the reality
		// of what it's returning.
		return (this.logger.level as unknown as Level).levelStr
	}

	set level(level: string) {
		this.logger.level = level
	}

	/* eslint-disable @typescript-eslint/no-explicit-any */
	trace(message: any, ...args: any[]): void {
		this.logger.trace(message, ...args)
	}
	debug(message: any, ...args: any[]): void {
		this.logger.debug(message, ...args)
	}
	info(message: any, ...args: any[]): void {
		this.logger.info(message, ...args)
	}
	warn(message: any, ...args: any[]): void {
		this.logger.warn(message, ...args)
	}
	error(message: any, ...args: any[]): void {
		this.logger.error(message, ...args)
	}
	fatal(message: any, ...args: any[]): void {
		this.logger.fatal(message, ...args)
	}
	/* eslint-enable */

	isTraceEnabled(): boolean {
		return this.logger.isTraceEnabled()
	}
	isDebugEnabled(): boolean {
		return this.logger.isDebugEnabled()
	}
	isInfoEnabled(): boolean {
		return this.logger.isInfoEnabled()
	}
	isWarnEnabled(): boolean {
		return this.logger.isWarnEnabled()
	}
	isErrorEnabled(): boolean {
		return this.logger.isErrorEnabled()
	}
	isFatalEnabled(): boolean {
		return this.logger.isFatalEnabled()
	}
}


export class LogManager {
	private getLog4jsLogger?: (name: string) => Logger
	private loggersByName: { [name: string]: APILogger }

	constructor() {
		this.loggersByName = {}
	}

	init(config: LoggingConfig): void {
		this.getLog4jsLogger = configure(config).getLogger
	}

	getLogger(name: string): APILogger {
		if (!this.getLog4jsLogger) {
			throw new Error('logging not initialized')
		}

		if (name in this.loggersByName) {
			return this.loggersByName[name]
		}

		const logger = new Log4JSLogger(this.getLog4jsLogger(name))
		this.loggersByName[name] = logger
		return logger
	}
}

export function defaultLoggingConfig(logFilename: string): LoggingConfig {
	const fileAppender: FileAppender = {
		type: 'file',
		filename: logFilename,
		maxLogSize: DEFAULT_LOG_FILE_SIZE,
		backups: 1,
		keepFileExt: true,
	}

	const stderrAppender: StandardErrorAppender = { type: 'stderr' }

	const LogLevelFilterAppender: LogLevelFilterAppender = {
		type: 'logLevelFilter',
		appender: 'stderr',
		level: 'error',
	}

	return {
		appenders: {
			smartthings: fileAppender,
			stderr: stderrAppender,
			errors: LogLevelFilterAppender,
		},
		categories: {
			default: { appenders: ['smartthings', 'errors'], level: 'warn' },
			'rest-client': { appenders: ['smartthings', 'errors'], level: 'warn' },
			cli: { appenders: ['smartthings', 'errors'], level: 'warn' },
		},
	}
}

export function loadLoggingConfig(configFilename: string, defaultConfig: LoggingConfig): LoggingConfig {
	if (!yamlExists(configFilename)) {
		return defaultConfig
	}

	const parsed = yaml.load(fs.readFileSync(configFilename, 'utf-8'))
	if (parsed && typeof parsed === 'object') {
		return parsed as LoggingConfig
	}
	throw new Error(`invalid or unreadable logging config file format; see ${LOGGING_DOCS_URL}`)
}

if (!('_logManager' in (global as { _logManager?: LogManager }))) {
	(global as { _logManager?: LogManager })._logManager = new LogManager()
}

export const logManager: LogManager = (global as unknown as { _logManager: LogManager })._logManager
