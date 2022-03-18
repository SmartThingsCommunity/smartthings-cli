import { CLIConfig, CLIConfigDescription } from '../cli-config'


export const loadConfig = jest.fn().mockImplementation(async (description: CLIConfigDescription): Promise<CLIConfig> =>
	({
		...description,
		profiles: {},
		managedProfiles: {},
		mergedProfiles: {},
		profile: {},
	}))


export const setConfigKey = jest.fn()
