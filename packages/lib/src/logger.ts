import { configure, Configuration, Logger } from 'log4js'

import { Logger as APILogger } from '@smartthings/core-sdk'


class Log4JSLogger implements APILogger {
	constructor(private logger: Logger) {
	}

	get level(): string {
		return this.logger.level
	}

	set level(level: string) {
		this.logger.level = level
	}

	/* eslint-disable @typescript-eslint/no-explicit-any */
	log(...args: any[]): void {
		this.logger.log(...args)
	}
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

	init(config: Configuration): void {
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

export const logManager: LogManager = new LogManager()
