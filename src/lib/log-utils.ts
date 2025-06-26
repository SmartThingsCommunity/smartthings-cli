import fs from 'node:fs'

import yaml from 'js-yaml'
import { Configuration as Log4jsConfig, Logger, FileAppender, StandardErrorAppender } from 'log4js'

import { Logger as CoreSDKLogger } from '@smartthings/core-sdk'

import { yamlExists } from './io-util.js'
import { fatalError } from './util.js'


const defaultLogFileSize = 1_000_000 // bytes
const loggingDocsURL = 'https://github.com/SmartThingsCommunity/smartthings-cli/' +
	'blob/main/packages/cli/doc/configuration.md#logging'


export function buildDefaultLog4jsConfig(logFilename: string): Log4jsConfig {
	const config: Log4jsConfig = {
		appenders: {},
		categories: {
			default: { appenders: ['smartthings'], level: 'warn' },
		},
	}

	const fileAppender: FileAppender = {
		type: 'file',
		filename: logFilename,
		maxLogSize: defaultLogFileSize,
		backups: 1,
		keepFileExt: true,
	}

	config.appenders.smartthings = fileAppender

	if (process.env.SMARTTHINGS_DEBUG) {
		const stderrAppender: StandardErrorAppender = { type: 'stderr' }

		config.appenders.debug = stderrAppender
		config.categories.default.appenders.push('debug')
		config.categories.default.level = 'debug'
	}

	return config
}

function isLog4jsConfig(config: unknown): config is Log4jsConfig {
	return !!config && typeof config === 'object' &&
		(config as Log4jsConfig).appenders !== undefined &&
		(config as Log4jsConfig).categories !== undefined
}

export function loadLog4jsConfig(configFilename: string, defaultConfig: Log4jsConfig): Log4jsConfig {
	if (!yamlExists(configFilename)) {
		return defaultConfig
	}

	const parsedConfig = yaml.load(fs.readFileSync(configFilename, 'utf-8'))
	if (isLog4jsConfig(parsedConfig)) {
		return parsedConfig
	}

	return fatalError(`invalid or unreadable logging config file format; see ${loggingDocsURL}`)
}

/**
 * Create a proxy for a log4js logger that is compatible with the core SDK's `Logger` type.
 */
export const coreSDKLoggerFromLog4JSLogger = (logger: Logger): CoreSDKLogger => {
	return {
		get level(): string {
			return typeof logger.level === 'string' ? logger.level : logger.level.levelStr
		},

		set level(level: string) {
			logger.level = level
		},

		/* eslint-disable @typescript-eslint/no-explicit-any */
		/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
		trace: (message: any, ...args: any[]) => logger.trace(message, ...args),
		debug: (message: any, ...args: any[]) => logger.debug(message, ...args),
		info: (message: any, ...args: any[]) => logger.info(message, ...args),
		warn: (message: any, ...args: any[]) => logger.warn(message, ...args),
		error: (message: any, ...args: any[]) => logger.error(message, ...args),
		fatal: (message: any, ...args: any[]) => logger.fatal(message, ...args),
		/* eslint-enable @typescript-eslint/no-explicit-any */
		/* eslint-enable @typescript-eslint/explicit-module-boundary-types */

		isTraceEnabled: (): boolean => logger.isTraceEnabled(),
		isDebugEnabled: (): boolean => logger.isDebugEnabled(),
		isInfoEnabled: (): boolean => logger.isInfoEnabled(),
		isWarnEnabled: (): boolean => logger.isWarnEnabled(),
		isErrorEnabled: (): boolean => logger.isErrorEnabled(),
		isFatalEnabled: (): boolean => logger.isFatalEnabled(),
	}
}
