import fs from 'fs'
import yaml from 'js-yaml'
import { Configuration as LoggingConfig, FileAppender, StandardErrorAppender, LogLevelFilterAppender } from 'log4js'

import { yamlExists } from '@smartthings/cli-lib'


const DEFAULT_LOG_FILE_SIZE = 1_000_000 // bytes
const LOGGING_DOCS_URL = 'https://github.com/SmartThingsCommunity/smartthings-cli/' +
	'blob/master/packages/cli/doc/configuration.md#logging'


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
