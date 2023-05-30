import { CLIConfig, CLIConfigDescription } from '../cli-config.js'


export const mergeProfiles = jest.fn()

export const loadConfig = jest.fn().mockImplementation(async (description: CLIConfigDescription): Promise<CLIConfig> =>
	({
		...description,
		profiles: {},
		managedProfiles: {},
		mergedProfiles: {},
		profile: {},
	}))


export const setConfigKey = jest.fn()
export const resetManagedConfigKey = jest.fn()
export const resetManagedConfig = jest.fn()
