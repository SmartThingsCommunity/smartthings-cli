import log4js from 'log4js'
import { Argv } from 'yargs'

import { CLIConfig, loadConfig, Profile } from '../cli-config.js'
import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../log-utils.js'
import { BuildOutputFormatterFlags } from './output-builder.js'
import { defaultTableGenerator, TableGenerator } from '../table-generator.js'


export type SmartThingsCommandFlags = {
	profile: string
}

export const smartThingsCommandBuilder = <T extends object = object>(yargs: Argv<T>): Argv<T & SmartThingsCommandFlags> =>
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

	// convenience methods for safely accessing configuration values

	/**
	 * If the configured `keyName` value exists and is a string, return it. Otherwise, return
	 * the default value. This method logs a warning (and returns the default value) if the
	 * configured keyName exists but is not a string. (The default `defaultValue` is `undefined`.)
	 */
	stringConfigValue(keyName: string): string | undefined
	stringConfigValue(keyName: string, defaultValue: string): string
	stringConfigValue(keyName: string, defaultValue?: string): string | undefined

	/**
	 * If the configured `keyName` exists and is a string or a string array, return it. (A simple
	 * string will be returned as a single-element array.) Otherwise, return the default value.
	 * This method logs a warning (and returns the default value) if the configured keyName exists
	 * but is not a string or array of strings. (The default `defaultValue` is an empty array.)
	 */
	stringArrayConfigValue(keyName: string, defaultValue?: string[]): string[]

	/**
	 * If the configured `keyName` value exists and is a boolean, return it. Otherwise, return
	 * the default value. This method logs a warning if the configured keyName
	 * exists but is not a boolean.
	 */
	booleanConfigValue(keyName: string, defaultValue?: boolean): boolean
}

/**
 * A function to be called at the start of every CLI command that sets up shared things.
 */
export const smartThingsCommand = async <T extends SmartThingsCommandFlags>(flags: T): Promise<SmartThingsCommand<T>> => {
	// TODO: need to be platform-independent
	const configDir = `${process.env['HOME']}/.config/@smartthings/cli`
	const cacheDir = `${process.env['HOME']}/.config/@smartthings/cli`

	const defaultLogConfig = buildDefaultLog4jsConfig(`${cacheDir}/smartthings.log`)
	const logConfig = loadLog4jsConfig(`${configDir}/logging.yaml`, defaultLogConfig)

	log4js.configure(logConfig)

	const logger = log4js.getLogger('cli')

	const profileName = flags.profile

	const cliConfig = await loadConfig({
		configFilename: `${configDir}/config.yaml`,
		managedConfigFilename: `${configDir}/config-managed.yaml`,
		profileName,
	})

	const profile = cliConfig.profile

	const groupRowsFlag = (flags as Pick<BuildOutputFormatterFlags, 'groupRows'>).groupRows
	const groupRows = groupRowsFlag ?? booleanConfigValue('groupTableOutputRows', true)

	const tableGenerator = defaultTableGenerator({ groupRows })

	function stringConfigValue(keyName: string): string
	function stringConfigValue(keyName: string, defaultValue: string): string
	function stringConfigValue(keyName: string, defaultValue?: string): string | undefined {
		if (keyName in profile) {
			const configValue = profile[keyName]
			if (typeof configValue === 'string') {
				return configValue
			}
			logger.warn(`expected string value for config key ${keyName} but got ${typeof profile[keyName]}`)
			return defaultValue
		}
		logger.trace(`key ${keyName} not found in ${profileName} config`)
		return defaultValue
	}

	function stringArrayConfigValue(keyName: string, defaultValue: string[] = []): string[] {
		if (keyName in profile) {
			const configValue = profile[keyName]
			if (typeof configValue === 'string') {
				return [configValue]
			}
			if (Array.isArray(configValue) && configValue.every(dir => typeof dir === 'string')) {
				return configValue
			}
			logger.warn(`expected string or array of strings for config key ${keyName} but got ${typeof configValue}`)
			return defaultValue
		}
		return defaultValue
	}

	function booleanConfigValue(keyName: string, defaultValue = false): boolean {
		if (keyName in profile) {
			const configValue = profile[keyName]
			if (typeof configValue === 'boolean') {
				return configValue
			}
			logger.warn(`expected boolean value for config key ${keyName} but got ${typeof profile[keyName]}`)
			return defaultValue
		}
		logger.trace(`key ${keyName} not found in ${profileName} config`)
		return defaultValue
	}

	return {
		flags,
		configDir,
		cacheDir,
		cliConfig,
		profileName,
		profile,
		tableGenerator,
		stringConfigValue,
		stringArrayConfigValue,
		booleanConfigValue,
		logger,
	}
}
