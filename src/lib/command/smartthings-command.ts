import log4js from 'log4js'
import { type Argv } from 'yargs'

import { type CLIConfig, loadConfig, type Profile } from '../cli-config.js'
import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../log-utils.js'
import { BuildOutputFormatterFlags } from './output-builder.js'
import { defaultTableGenerator, type TableGenerator } from '../table-generator.js'


export type SmartThingsCommandFlags = {
	profile: string
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

/**
 * An interface version of SmartThingsCommand to make its contract easier to mix with other
 * interfaces and to limit what we need to mock for tests.
 */
export type SmartThingsCommand<T extends SmartThingsCommandFlags = SmartThingsCommandFlags> = {
	flags: T

	configDir: string
	cacheDir: string

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
 * A function to be called at the start of every CLI command that sets up shared things.
 */
export const smartThingsCommand = async <T extends SmartThingsCommandFlags>(
	flags: T,
): Promise<SmartThingsCommand<T>> => {
	// TODO: need to be platform-independent
	const configDir = `${process.env['HOME']}/.config/@smartthings/cli`
	const cacheDir = `${process.env['HOME']}/Library/Caches/@smartthings/cli`

	const defaultLogConfig = buildDefaultLog4jsConfig(`${cacheDir}/smartthings.log`)
	const logConfig = loadLog4jsConfig(`${configDir}/logging.yaml`, defaultLogConfig)

	log4js.configure(logConfig)

	const logger = log4js.getLogger('cli')

	const profileName = flags.profile

	const cliConfig = await loadConfig({
		configFilename: `${configDir}/config.yaml`,
		managedConfigFilename: `${cacheDir}/config-managed.yaml`,
		profileName,
	}, logger)

	const profile = cliConfig.profile

	const groupRowsFlag = (flags as Pick<BuildOutputFormatterFlags, 'groupRows'>).groupRows
	const groupRows = groupRowsFlag ?? cliConfig.booleanConfigValue('groupTableOutputRows', true)

	const tableGenerator = defaultTableGenerator({ groupRows })

	return {
		flags,
		configDir,
		cacheDir,
		cliConfig,
		profileName,
		profile,
		tableGenerator,
		logger,
	}
}
