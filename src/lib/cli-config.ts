import { readFile, writeFile } from 'fs/promises'

import { Logger } from 'log4js'
import yaml from 'js-yaml'

import { yamlExists } from './io-util.js'


export const seeConfigDocs = 'see https://github.com/SmartThingsCommunity/smartthings-cli/blob/main/packages/cli/doc/configuration.md for more information'

export type Profile = Record<string, unknown>
export type ProfilesByName = Record<string, Profile>

export type CLIConfigDescription = {
	/**
	 * The name of the user-editable configuration file.
	 */
	configFilename: string

	/**
	 * The name of the configuration file managed by the CLI.
	 */
	managedConfigFilename: string

	/**
	 * The name of the currently selected profile.
	 */
	profileName: string
}

export type CLIConfig = CLIConfigDescription & {
	profiles: ProfilesByName
	managedProfiles: ProfilesByName
	mergedProfiles: ProfilesByName

	/**
	 * A convenience reference to the selected profile (same as `mergedConfig[profileName]`).
	 */
	profile: Profile

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

export const loadConfigFile = async (filename: string): Promise<ProfilesByName> => {
	if (!yamlExists(filename)) {
		return {}
	}

	const parsed = yaml.load(await readFile(filename, 'utf-8'))
	if (parsed) {
		if (typeof parsed === 'object' && !Array.isArray(parsed)) {
			const errors: string[] = []
			const config: ProfilesByName = {}
			for (const [profileName, profile] of Object.entries(parsed)) {
				if (typeof(profile) === 'object' && !Array.isArray(profile)) {
					config[profileName] = profile
				} else {
					errors.push(`bad profile ${profileName}; profile must be an object`)
				}
			}
			if (errors.length) {
				throw Error(`${errors.join('\n')}\n${seeConfigDocs}`)
			}
			return config
		} else {
			throw Error('invalid config file format\n' + seeConfigDocs)
		}
	}
	return {}
}

/**
 * Merge profiles from `preferred` and `secondary`, favoring any config entries from `preferred`
 * over those in `secondary`.
 */
export const mergeProfiles = (preferred: ProfilesByName, secondary: ProfilesByName): ProfilesByName => {
	const mergeInto = (into: ProfilesByName, from: ProfilesByName): ProfilesByName => {
		for (const [profileName, profileData] of Object.entries(from)) {
			if (!(profileName in into)) {
				into[profileName] = {}
			}
			Object.assign(into[profileName], profileData)
		}
		return into
	}
	return mergeInto(mergeInto({}, secondary), preferred)
}

export const loadConfig = async (description: CLIConfigDescription, logger: Logger): Promise<CLIConfig> => {
	const config = await loadConfigFile(description.configFilename)
	const managedProfiles = await loadConfigFile(description.managedConfigFilename)
	const mergedProfiles = mergeProfiles(config, managedProfiles)

	const profile = description.profileName in mergedProfiles
		? mergedProfiles[description.profileName]
		: {}

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
		logger.trace(`key ${keyName} not found in ${description.profileName} config`)
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
		logger.trace(`key ${keyName} not found in ${description.profileName} config`)
		return defaultValue
	}

	return {
		...description,
		profiles: config,
		managedProfiles,
		mergedProfiles,
		profile,
		stringConfigValue,
		stringArrayConfigValue,
		booleanConfigValue,
	}
}

const managedConfigHeader =
`# This file is used to store settings managed by the CLI. Users are not meant to edit it directly.
# Any options in the main config file will override values from this one.

`

/**
 * Save the specified configuration key into managed config so it will be picked up
 * in the future but not override user settings.
 */
export const setConfigKey = async (config: CLIConfig, key: string, value: unknown): Promise<void> => {
	config.managedProfiles = mergeProfiles({ [config.profileName]: { [key]: value } }, config.managedProfiles)
	await writeFile(config.managedConfigFilename, managedConfigHeader + yaml.dump(config.managedProfiles))
	config.mergedProfiles = mergeProfiles(config.profiles, config.managedProfiles)
}

/**
 * Reset the specified managed config key for for all profiles. The `predicate` is called for each
 * value found and the key will only be reset if it returns true.
 *
 * This can be used to wipe out default values when something is deleted.
 */
export const resetManagedConfigKey = async (config: CLIConfig, key: string, predicate?: (value: unknown) => boolean): Promise<void> => {
	config.managedProfiles = Object.fromEntries(Object.entries(config.managedProfiles).map(([profileName, profile]) => {
		if (key in profile && (!predicate || predicate(profile[key]))) {
			delete profile[key]
		}
		return [profileName, profile]
	}))

	await writeFile(config.managedConfigFilename, managedConfigHeader + yaml.dump(config.managedProfiles))
	config.mergedProfiles = mergeProfiles(config.profiles, config.managedProfiles)
}

/**
 * Reset all managed config options for the specified profile.
 */
export const resetManagedConfig = async (config: CLIConfig, profileName: string): Promise<void> => {
	config.managedProfiles = { ...config.managedProfiles }
	delete config.managedProfiles[profileName]
	await writeFile(config.managedConfigFilename, managedConfigHeader + yaml.dump(config.managedProfiles))
	config.mergedProfiles = mergeProfiles(config.profiles, config.managedProfiles)
}
