import { jest } from '@jest/globals'

import { readFile, writeFile } from 'fs/promises'

import yaml from 'js-yaml'

import {
	CLIConfig,
	CLIConfigDescription,
	ProfilesByName,
} from '../../lib/cli-config.js'
import { yamlExists } from '../../lib/io-util.js'


const readFileMock = jest.fn<typeof readFile>()
const writeFileMock = jest.fn<typeof writeFile>()
jest.unstable_mockModule('fs/promises', () => ({
	readFile: readFileMock,
	writeFile: writeFileMock,
}))

const yamlLoadMock = jest.fn<typeof yaml.load>()
const yamlDumpMock = jest.fn<typeof yaml.dump>()
jest.unstable_mockModule('js-yaml', () => ({
	default: {
		load: yamlLoadMock,
		dump: yamlDumpMock,
	},
}))

const yamlExistsMock = jest.fn<typeof yamlExists>()
yamlExistsMock.mockReturnValue(true)
jest.unstable_mockModule('../../lib/io-util.js', () => ({
	yamlExists: yamlExistsMock,
}))


const {
	loadConfig,
	loadConfigFile,
	mergeProfiles,
	resetManagedConfig,
	resetManagedConfigKey,
	seeConfigDocs,
	setConfigKey,
} = await import('../../lib/cli-config.js')


describe('cli-config', () => {
	describe('loadConfigFile', () => {
		it('returns empty object when filename does not exist', async () => {
			yamlExistsMock.mockReturnValueOnce(false)

			expect(await loadConfigFile('does/not/exist')).toEqual({})

			expect(yamlExistsMock).toHaveBeenCalledTimes(1)
			expect(yamlExistsMock).toHaveBeenCalledWith('does/not/exist')
			expect(yamlLoadMock).toHaveBeenCalledTimes(0)
			expect(readFileMock).toHaveBeenCalledTimes(0)
		})

		it('returns empty object for empty file', async () => {
			readFileMock.mockResolvedValueOnce('empty contents')
			yamlLoadMock.mockReturnValueOnce('')

			expect(await loadConfigFile('empty file')).toEqual({})

			expect(yamlExistsMock).toHaveBeenCalledTimes(1)
			expect(yamlExistsMock).toHaveBeenCalledWith('empty file')
			expect(readFileMock).toHaveBeenCalledTimes(1)
			expect(readFileMock).toHaveBeenCalledWith('empty file', 'utf-8')
			expect(yamlLoadMock).toHaveBeenCalledTimes(1)
			expect(yamlLoadMock).toHaveBeenCalledWith('empty contents')
		})

		it.each(['string', ['array']])('throws error for non-object yaml file', async (parsedYAML) => {
			readFileMock.mockResolvedValueOnce('file contents')
			yamlLoadMock.mockReturnValueOnce(parsedYAML)

			await expect(loadConfigFile('configFilename.json'))
				.rejects.toThrow('invalid config file format\n' + seeConfigDocs)

			expect(yamlExistsMock).toHaveBeenCalledTimes(1)
			expect(yamlExistsMock).toHaveBeenCalledWith('configFilename.json')
			expect(readFileMock).toHaveBeenCalledTimes(1)
			expect(readFileMock).toHaveBeenCalledWith('configFilename.json', 'utf-8')
			expect(yamlLoadMock).toHaveBeenCalledTimes(1)
			expect(yamlLoadMock).toHaveBeenCalledWith('file contents')
		})

		it('combines errors for individual profiles', async () => {
			readFileMock.mockResolvedValueOnce('config with multiple errors')
			yamlLoadMock.mockReturnValueOnce({
				goodProfile: {},
				badProfile1: 'just a string',
				badProfile2: ['array', 'of', 'strings'],
			})

			await expect(loadConfigFile('file with bad configs'))
				.rejects.toThrow('bad profile badProfile1; profile must be an object\n' +
					'bad profile badProfile2; profile must be an object\n' +  seeConfigDocs)

			expect(yamlExistsMock).toHaveBeenCalledTimes(1)
			expect(yamlExistsMock).toHaveBeenCalledWith('file with bad configs')
			expect(readFileMock).toHaveBeenCalledTimes(1)
			expect(readFileMock).toHaveBeenCalledWith('file with bad configs', 'utf-8')
			expect(yamlLoadMock).toHaveBeenCalledTimes(1)
			expect(yamlLoadMock).toHaveBeenCalledWith('config with multiple errors')
		})

		it('returns properly formatted config file', async () => {
			const goodConfig = {
				goodProfile1: {
					config1: 'configured value',
					config2: ['array', 'of', 'strings'],
				},
				goodProfile2: {
					config1: 'another value',
					config3: { complex: 'config' },
				},
			}
			readFileMock.mockResolvedValueOnce('good contents')
			yamlLoadMock.mockReturnValueOnce(goodConfig)

			expect(await loadConfigFile('good file')).toEqual(goodConfig)

			expect(yamlExistsMock).toHaveBeenCalledTimes(1)
			expect(yamlExistsMock).toHaveBeenCalledWith('good file')
			expect(readFileMock).toHaveBeenCalledTimes(1)
			expect(readFileMock).toHaveBeenCalledWith('good file', 'utf-8')
			expect(yamlLoadMock).toHaveBeenCalledTimes(1)
			expect(yamlLoadMock).toHaveBeenCalledWith('good contents')
		})
	})

	describe('mergeProfiles', () => {
		it('returns empty config given two empty configs', () => {
			const preferred = {} as ProfilesByName
			const secondary = {} as ProfilesByName

			expect(mergeProfiles(preferred, secondary)).toEqual({})
		})

		it('includes profiles from both inputs', () => {
			const preferred = { profile1: { configItem1: 'value 1' } } as ProfilesByName
			const secondary = { profile2: { configItem2: 'value 2' } } as ProfilesByName

			expect(mergeProfiles(preferred, secondary)).toEqual({
				profile1: { configItem1: 'value 1' },
				profile2: { configItem2: 'value 2' },
			})
		})

		it('combines config values from both inputs', () => {
			const preferred = { profile1: { configItem1: 'value 1' } } as ProfilesByName
			const secondary = { profile1: { configItem2: 'value 2' } } as ProfilesByName

			expect(mergeProfiles(preferred, secondary)).toEqual({
				profile1: {
					configItem1: 'value 1',
					configItem2: 'value 2',
				},
			})
		})

		it('config values from preferred are used over secondary values', () => {
			const preferred = { profile1: { configItem1: 'preferred value' } } as ProfilesByName
			const secondary = { profile1: { configItem1: 'overridden value' } } as ProfilesByName

			expect(mergeProfiles(preferred, secondary)).toEqual({
				profile1: {
					configItem1: 'preferred value',
				},
			})
		})

		it('processes complicated example properly', () => {
			const preferred = {
				profileInBoth: {
					onlyInPreferred: 'only in preferred',
					inBoth: 'preferred value',
				},
				profileOnlyInPreferred: {
					configItem1: 'value 1',
					configItem2: 'value 2',
				},
			} as ProfilesByName
			const secondary = {
				profileInBoth: {
					inBoth: 'overridden value',
					onlyInSecondary: 'only in secondary',
				},
				profileOnlyInSecondary: {
					configItem1: 'value 1',
					configItem2: 'value 2',
				},
			} as ProfilesByName

			expect(mergeProfiles(preferred, secondary)).toEqual({
				profileInBoth: {
					onlyInPreferred: 'only in preferred',
					inBoth: 'preferred value',
					onlyInSecondary: 'only in secondary',
				},
				profileOnlyInPreferred: {
					configItem1: 'value 1',
					configItem2: 'value 2',
				},
				profileOnlyInSecondary: {
					configItem1: 'value 1',
					configItem2: 'value 2',
				},
			})
		})
	})

	const descriptionTemplate: CLIConfigDescription = {
		configFilename: 'config-filename.yaml',
		managedConfigFilename: 'managed-config-filename.yaml',
		profileName: 'chosenProfile',
	}

	const profiles: ProfilesByName = {
		mainConfigProfile: { key: 'value' },
		chosenProfile: { configKey: 'configured value' },
	}
	const managedProfiles: ProfilesByName = { managedConfigProfile: { key: 'value' } }
	const mergedProfiles: ProfilesByName = {
		...profiles,
		...managedProfiles,
		chosenProfile: { configKey: 'configured value' },
	}

	describe('loadConfig', () => {
		it('merges main and managed configurations', async () => {
			const description = descriptionTemplate
			const expected: CLIConfig = {
				...description,
				profiles,
				managedProfiles,
				mergedProfiles,
				profile: mergedProfiles.chosenProfile,
			}

			readFileMock.mockResolvedValue('good contents')
			yamlLoadMock.mockReturnValueOnce(profiles)
			yamlLoadMock.mockReturnValueOnce(managedProfiles)

			expect(await loadConfig(description)).toStrictEqual(expected)

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(description.configFilename, 'utf-8')
			expect(readFileMock).toHaveBeenCalledWith(description.managedConfigFilename, 'utf-8')
		})

		it('uses empty profile if none exists', async () => {
			const description = {
				...descriptionTemplate,
				profileName: 'nonExistentProfile',
			}
			const expected: CLIConfig = {
				...description,
				profiles,
				managedProfiles,
				mergedProfiles,
				profile: {},
			}

			readFileMock.mockResolvedValue('good contents')
			yamlLoadMock.mockReturnValueOnce(profiles)
			yamlLoadMock.mockReturnValueOnce(managedProfiles)

			expect(await loadConfig(description)).toStrictEqual(expected)

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(description.configFilename, 'utf-8')
			expect(readFileMock).toHaveBeenCalledWith(description.managedConfigFilename, 'utf-8')
		})
	})

	test('setConfigKey writes updated file and updates config', async () => {
		const description = descriptionTemplate
		const cliConfig = {
			...description,
			profileName: 'updatedProfile',
			profiles,
			managedProfiles,
		} as CLIConfig

		readFileMock.mockResolvedValue('good contents')
		yamlLoadMock.mockReturnValueOnce(profiles)
		yamlLoadMock.mockReturnValueOnce(managedProfiles)

		yamlDumpMock.mockReturnValueOnce('yaml output')

		await expect(setConfigKey(cliConfig, 'keyToSet', 'value')).resolves.not.toThrow()

		expect(yamlDumpMock).toHaveBeenCalledTimes(1)
		expect(yamlDumpMock).toHaveBeenCalledWith({
			...managedProfiles,
			updatedProfile: {
				keyToSet: 'value',
			},
		})
		expect(writeFileMock).toHaveBeenCalledTimes(1)
		expect(writeFileMock).toHaveBeenCalledWith(description.managedConfigFilename,
			expect.stringContaining('yaml output'))
	})

	describe('resetManagedConfigKey', () => {
		const deepCopy = <T> (input: T): T => JSON.parse(JSON.stringify(input))
		const makeConfig = (profiles: ProfilesByName, managedProfiles: ProfilesByName): CLIConfig => deepCopy({
			...descriptionTemplate,
			profileName: 'defaultProfile',
			profiles,
			managedProfiles,
			mergedProfiles: mergeProfiles(profiles, managedProfiles),
		} as CLIConfig)

		const profilesWithKeyToRemove: ProfilesByName = {
			profile1: {
				keyToRemove: 'remove value',
			},
			profile2: {
				keyToRemove: 'value to remove',
			},
		}
		const profilesWithKeysRemoved: ProfilesByName = {
			profile1: {},
			profile2: {},
		}

		const predicateMock = jest.fn<(value: unknown) => boolean>()

		it('does nothing when key not present', async () => {
			const cliConfig = makeConfig(profiles, managedProfiles)

			await expect(resetManagedConfigKey(cliConfig, 'unusedKey', predicateMock)).resolves.not.toThrow()

			expect(cliConfig).toStrictEqual(makeConfig(profiles, managedProfiles))
			expect(predicateMock).toHaveBeenCalledTimes(0)
		})

		it('does not modify user config', async () => {
			const cliConfig = makeConfig(profilesWithKeyToRemove, managedProfiles)

			predicateMock.mockReturnValue(true)
			await expect(resetManagedConfigKey(cliConfig, 'keyToRemove', predicateMock)).resolves.not.toThrow()

			expect(cliConfig).toStrictEqual(makeConfig(profilesWithKeyToRemove, managedProfiles))
			expect(predicateMock).toHaveBeenCalledTimes(0)
		})

		it('keeps keys that fail predicate', async () => {
			const cliConfig = makeConfig(profiles, profilesWithKeyToRemove)

			predicateMock.mockReturnValue(false)
			await expect(resetManagedConfigKey(cliConfig, 'keyToRemove', predicateMock)).resolves.not.toThrow()

			expect(cliConfig).toStrictEqual(makeConfig(profiles, profilesWithKeyToRemove))
			expect(predicateMock).toHaveBeenCalledTimes(2)
		})

		it('removes managed keys when no predicate is specified', async () => {
			const cliConfig = makeConfig(profiles, profilesWithKeyToRemove)

			await expect(resetManagedConfigKey(cliConfig, 'keyToRemove')).resolves.not.toThrow()

			expect(cliConfig).toStrictEqual(makeConfig(profiles, profilesWithKeysRemoved))
		})

		it('removes managed keys that match predicate', async () => {
			const cliConfig = makeConfig(profiles, profilesWithKeyToRemove)

			predicateMock.mockReturnValue(true)
			await expect(resetManagedConfigKey(cliConfig, 'keyToRemove', predicateMock)).resolves.not.toThrow()

			expect(cliConfig).toStrictEqual(makeConfig(profiles, profilesWithKeysRemoved))
			expect(predicateMock).toHaveBeenCalledTimes(2)
		})
	})

	test('resetManagedConfig', async () => {
		const managedProfilesWithProfileToReset: ProfilesByName = {
			...managedProfiles,
			profileToReset: { not: 'empty' },
		}
		const description = descriptionTemplate
		const cliConfig = {
			...description,
			profileName: 'updatedProfile',
			profiles,
			managedProfiles: { ...managedProfilesWithProfileToReset },
		} as CLIConfig
		yamlDumpMock.mockReturnValueOnce('yaml output')

		await expect(resetManagedConfig(cliConfig, 'profileToReset')).resolves.not.toThrow()

		expect(cliConfig.managedProfiles.profileToReset).toBeUndefined()
		expect(cliConfig.mergedProfiles).toStrictEqual(mergedProfiles)

		expect(yamlDumpMock).toHaveBeenCalledTimes(1)
		expect(yamlDumpMock).toHaveBeenCalledWith(managedProfiles)
		expect(writeFileMock).toHaveBeenCalledTimes(1)
		expect(writeFileMock).toHaveBeenCalledWith(description.managedConfigFilename,
			expect.stringContaining('yaml output'))
	})
})
