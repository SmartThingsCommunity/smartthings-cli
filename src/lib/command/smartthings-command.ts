import envPaths from 'env-paths'
import log4js from 'log4js'
import { type Argv } from 'yargs'

import { type CLIConfig, loadConfig, type Profile } from '../cli-config.js'
import { ensureDir } from '../file-util.js'
import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../log-utils.js'
import { defaultTableGenerator, type TableGenerator } from '../table-generator.js'
import { copyIfExists, oldDirs } from '../yargs-transition-temp.js'
import type { BuildOutputFormatterFlags } from './output-builder.js'


export type SmartThingsCommandFlags = {
	profile: string
	verboseDirectoryLogging?: boolean
}

export const smartThingsCommandBuilder = <T extends object = object>(
	yargs: Argv<T>,
): Argv<T & SmartThingsCommandFlags> =>
	yargs.env('SMARTTHINGS')
		.option('profile', {
			alias: 'p',
			describe: 'configuration profile',
			type: 'string',
			default: 'default',
		})
		// This option is temporary and will be removed when removing automatic copy
		// of old configuration files. (See also yargs-transition-temp.ts.)
		.option('verbose-directory-logging', {
			describe: 'log information about config, data, and logging directories to stderr',
			type: 'boolean',
			default: false,
			hidden: true,
		})

type Dirs = {
	configDir: string
	dataDir: string
	logDir: string
}

/**
 * An interface version of SmartThingsCommand to make its contract easier to mix with other
 * interfaces and to limit what we need to mock for tests.
 */
export type SmartThingsCommand<T extends SmartThingsCommandFlags = SmartThingsCommandFlags> =
	& Dirs
	& {
		flags: T

		/**
		 * The full configuration set, including both user-configured and cli-managed configuration
		 * values and all profiles. Most often you will just want to use `profile` instead.
		 */
		cliConfig: CLIConfig

		/**
		 * The name of the in-use profile.
		 */
		profileName: string

		/**
		 * The configuration set for the selected profile.
		 */
		profile: Profile

		// TODO: move to output-builder.ts
		tableGenerator: TableGenerator

		logger: log4js.Logger
	}

/**
 * Get config directories and copy old config files if they exist and there are no new ones.
 */
export const getConfigDirsCheckingForOldConfig = async (
		options: { verboseLogging: boolean },
): Promise<Dirs> => {
	const { oldConfigDir, oldCacheDir } = oldDirs()
	if (options.verboseLogging) {
		console.error(`old config dir = ${oldConfigDir}`)
		console.error(`old cache dir = ${oldCacheDir}`)
	}
	// The documentation says not to use `suffix` "unless you really have to" but the directories
	// get suffixed with `-nodejs` without using it. This would be fine for the data directory,
	// but for the config and log directories that users might use, it seems rather ugly.
	const { config: configDir, data: dataDir, log: logDir } = envPaths('@smartthings/cli', { suffix: '' })
	if (options.verboseLogging) {
		console.error(`config dir = ${configDir}`)
		console.error(`data dir = ${dataDir}`)
		console.error(`log dir = ${logDir}`)
	}
	await ensureDir(configDir)

	await copyIfExists({
		...options,
		filename: 'config.yaml',
		oldDir: oldConfigDir,
		newDir: configDir,
		description: 'configuration',
	})
	await copyIfExists({
		...options,
		filename: 'logging.yaml',
		oldDir: oldConfigDir,
		newDir: configDir,
		description: 'logging configuration',
	})
	await copyIfExists({
		...options,
		filename: 'credentials.json',
		oldDir: oldConfigDir,
		newDir: dataDir,
	})
	await copyIfExists({
		...options,
		filename: 'config-managed.yaml',
		oldDir: oldCacheDir,
		newDir: dataDir,
	})

	return { configDir, dataDir, logDir }
}

/**
 * A function to be called at the start of every CLI command that sets up shared things.
 */
export const smartThingsCommand = async <T extends SmartThingsCommandFlags>(
	flags: T,
): Promise<SmartThingsCommand<T>> => {
	const { configDir, dataDir, logDir } = await getConfigDirsCheckingForOldConfig(
		{ verboseLogging: !!flags.verboseDirectoryLogging },
	)

	const defaultLogConfig = buildDefaultLog4jsConfig(`${logDir}/smartthings.log`)
	const logConfig = loadLog4jsConfig(`${configDir}/logging.yaml`, defaultLogConfig)

	log4js.configure(logConfig)

	const logger = log4js.getLogger('cli')

	const profileName = flags.profile

	const cliConfig = await loadConfig({
		configFilename: `${configDir}/config.yaml`,
		managedConfigFilename: `${dataDir}/config-managed.yaml`,
		profileName,
	}, logger)

	const profile = cliConfig.profile

	const groupRowsFlag = (flags as Pick<BuildOutputFormatterFlags, 'groupRows'>).groupRows
	const groupRows = groupRowsFlag ?? cliConfig.booleanConfigValue('groupTableOutputRows', true)

	const tableGenerator = defaultTableGenerator({ groupRows })

	return {
		flags,
		configDir,
		dataDir,
		logDir,
		cliConfig,
		profileName,
		profile,
		tableGenerator,
		logger,
	}
}
