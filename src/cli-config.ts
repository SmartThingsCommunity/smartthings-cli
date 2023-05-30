import yaml from 'js-yaml'
import { readFile, writeFile, yamlExists } from './io-util.js'


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

export const loadConfig = async (description: CLIConfigDescription): Promise<CLIConfig> => {
	const config = await loadConfigFile(description.configFilename)
	const managedProfiles = await loadConfigFile(description.managedConfigFilename)
	const mergedProfiles = mergeProfiles(config, managedProfiles)

	const profile = description.profileName in mergedProfiles
		? mergedProfiles[description.profileName]
		: {}

	return { ...description, profiles: config, managedProfiles, mergedProfiles, profile }
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
