import fs from 'fs'
import yaml from 'js-yaml'
import { Configuration as Log4jsConfig, FileAppender, StandardErrorAppender } from 'log4js'
import { yamlExists } from '@smartthings/cli-lib'


const DEFAULT_LOG_FILE_SIZE = 1_000_000 // bytes
const LOGGING_DOCS_URL = 'https://github.com/SmartThingsCommunity/smartthings-cli/' +
	'blob/master/packages/cli/doc/configuration.md#logging'


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
		maxLogSize: DEFAULT_LOG_FILE_SIZE,
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

	throw new Error(`invalid or unreadable logging config file format; see ${LOGGING_DOCS_URL}`)
}
