import { jest } from '@jest/globals'

import type { join } from 'node:path'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Profile, ProfilesByName } from '../../lib/cli-config.js'
import type { CommandArgs } from '../../commands/config.js'
import type { stringTranslateToId } from '../../lib/command/command-util.js'
import type { TableCommonListOutputProducer, TableCommonOutputProducer } from '../../lib/command/format.js'
import type { outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { outputItem } from '../../lib/command/output-item.js'
import { type outputList } from '../../lib/command/output-list.js'
import type {
	OutputFormatter,
	calculateOutputFormat,
	writeOutput,
} from '../../lib/command/output.js'
import type { BuildOutputFormatterFlags, buildOutputFormatter } from '../../lib/command/output-builder.js'
import type {
	SmartThingsCommand,
	SmartThingsCommandFlags,
	smartThingsCommand,
	smartThingsCommandBuilder,
} from '../../lib/command/smartthings-command.js'
import type { ValueTableFieldDefinition } from '../../lib/table-generator.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'


const joinMock = jest.fn<typeof join>().mockImplementation((...paths: string[]) => paths.join('|'))
jest.unstable_mockModule('node:path', () => ({
	join: joinMock,
}))

const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const outputItemMock = jest.fn<typeof outputItem>()
jest.unstable_mockModule('../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
}))

const outputListMock = jest.fn<typeof outputList>()
jest.unstable_mockModule('../../lib/command/output-list.js', () => ({
	outputList: outputListMock,
}))

const calculateOutputFormatMock = jest.fn<typeof calculateOutputFormat>()
const writeOutputMock = jest.fn<typeof writeOutput>()
jest.unstable_mockModule('../../lib/command/output.js', () => ({
	calculateOutputFormat: calculateOutputFormatMock,
	writeOutput: writeOutputMock,
}))

const buildOutputFormatterMock = jest.fn<typeof buildOutputFormatter>()
jest.unstable_mockModule('../../lib/command/output-builder.js', () => ({
	buildOutputFormatter: buildOutputFormatterMock,
}))

const smartThingsCommandMock = jest.fn<typeof smartThingsCommand>()
const smartThingsCommandBuilderMock = jest.fn<typeof smartThingsCommandBuilder>()
jest.unstable_mockModule('../../lib/command/smartthings-command.js', () => ({
	smartThingsCommand: smartThingsCommandMock,
	smartThingsCommandBuilder: smartThingsCommandBuilderMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../commands/config.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: smartThingsCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	smartThingsCommandBuilderMock.mockReturnValue(smartThingsCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const profile1: Profile = {
		key1: 'value1',
		key2: false,
	}
	const profile2: Profile = {
		key1: 'value1',
		key3: ['one', 'thing', 'or', 'another'],
	}
	const profile1WithName = { name: 'profile1', profile: profile1 }
	const profile2WithName = { name: 'profile2', profile: profile2 }
	const mergedProfiles: ProfilesByName = { profile1, profile2 }

	outputItemMock.mockResolvedValue(profile1WithName)
	outputListMock.mockResolvedValue([profile1WithName, profile2WithName])
	stringTranslateToIdMock.mockResolvedValue('translated-id')
	calculateOutputFormatMock.mockReturnValue('common')
	const outputFormatterMock = jest.fn<OutputFormatter<object>>().mockReturnValue('formatted output')
	buildOutputFormatterMock.mockReturnValue(outputFormatterMock)

	it('lists configs without args', async () => {
		const inputArgv = { profile: 'profile1', verbose: false } as ArgumentsCamelCase<CommandArgs>
		const command = {
			cliConfig: { mergedProfiles },
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(smartThingsCommandMock).toHaveBeenCalledTimes(1)
		expect(smartThingsCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(inputArgv)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'name' }),
			expect.any(Function), { includeIndex: true })

		const outputListConfig = outputListMock.mock.calls[0][1] as TableCommonListOutputProducer<object>
		expect(outputListConfig.listTableFieldDefinitions?.length).toBe(2)

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(outputItemMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(0)
		expect(writeOutputMock).toHaveBeenCalledTimes(0)

		const listFunction = outputListMock.mock.calls[0][2]
		expect(await listFunction()).toStrictEqual([profile1WithName, profile2WithName])
	})

	it('marks active config in list', async () => {
		const inputArgv = { profile: 'profile1', verbose: false } as ArgumentsCamelCase<CommandArgs>
		const command = {
			cliConfig: { mergedProfiles },
			profileName: 'profile1',
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(outputListMock).toHaveBeenCalledTimes(1)
		const outputListConfig = outputListMock.mock.calls[0][1] as TableCommonListOutputProducer<Profile>
		const fieldDefinition = outputListConfig.listTableFieldDefinitions[1] as ValueTableFieldDefinition<Profile>
		const valueFunction = fieldDefinition.value

		expect(fieldDefinition.label).toBe('Active')
		expect(valueFunction(profile1WithName)).toBe('true')
		expect(valueFunction(profile2WithName)).toBe('')
	})

	it('lists configs with extra fields when verbose requested', async () => {
		const inputArgv = { profile: 'profile1', verbose: true } as ArgumentsCamelCase<CommandArgs>
		const command = {
			cliConfig: { mergedProfiles },
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(outputListMock).toHaveBeenCalledTimes(1)

		const outputListConfig = outputListMock.mock.calls[0][1] as TableCommonListOutputProducer<object>
		expect(outputListConfig.listTableFieldDefinitions?.length).toBe(3)
		expect(outputListConfig.listTableFieldDefinitions?.[2]).toStrictEqual({ path: 'profile.token' })

		const listFunction = outputListMock.mock.calls[0][2]
		expect(await listFunction()).toStrictEqual([profile1WithName, profile2WithName])
	})

	it('displays baseURL in list if there is one in any profile', async () => {
		const inputArgv = { profile: 'profile1', verbose: true } as ArgumentsCamelCase<CommandArgs>
		const profile3: Profile = {
			key1: 'value of key 1',
			clientIdProvider: { baseURL: 'https://test-url' },
		}
		const profile3WithName = { name: 'profile3', profile: profile3 }
		const profiles: ProfilesByName = { ...mergedProfiles, profile3 }
		const command = {
			cliConfig: { mergedProfiles: profiles },
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(outputListMock).toHaveBeenCalledTimes(1)

		const outputListConfig = outputListMock.mock.calls[0][1] as TableCommonListOutputProducer<object>

		const listFunction = outputListMock.mock.calls[0][2]
		expect(await listFunction()).toStrictEqual([profile1WithName, profile2WithName, profile3WithName])
		expect(outputListConfig.listTableFieldDefinitions.length).toBe(4)
		expect(outputListConfig.listTableFieldDefinitions[3])
			.toStrictEqual({ label: 'API URL', value: expect.any(Function) })
	})

	it('supports JSON or YAML output', async () => {
		const inputArgv = { profile: 'profile1', verbose: false, output: 'output-file.json' } as ArgumentsCamelCase<CommandArgs>
		const flags: SmartThingsCommandFlags = { profile: 'default1' }
		const command = {
			cliConfig: { mergedProfiles },
			flags,
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		calculateOutputFormatMock.mockReturnValueOnce('json')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, command.cliConfig)
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(mergedProfiles)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('formatted output', 'output-file.json')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(outputListMock).toHaveBeenCalledTimes(0)
		expect(outputItemMock).toHaveBeenCalledTimes(0)
	})

	it('lists details of a specified config', async () => {
		const inputArgv = { profile: 'profile1', verbose: false, name: 'profile2' } as ArgumentsCamelCase<CommandArgs>
		const flags: SmartThingsCommandFlags = { profile: 'default1' }
		const command = {
			cliConfig: { mergedProfiles },
			flags,
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		stringTranslateToIdMock.mockResolvedValueOnce('profile2')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(smartThingsCommandMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(
			expect.objectContaining({}),
			'profile2',
			expect.any(Function),
		)
		expect(outputItemMock).toHaveBeenCalledTimes(1)
		expect(outputItemMock).toHaveBeenCalledWith(command, expect.objectContaining({}), expect.any(Function))

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(0)
		expect(outputListMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(0)
		expect(outputFormatterMock).toHaveBeenCalledTimes(0)
		expect(writeOutputMock).toHaveBeenCalledTimes(0)

		const getFunction = outputItemMock.mock.calls[0][2]
		expect(await getFunction()).toStrictEqual(profile2WithName)
	})

	it('displays full profile in detail view', async () => {
		const inputArgv = { profile: 'profile1', verbose: false, name: 'profile2' } as ArgumentsCamelCase<CommandArgs>
		const flags: SmartThingsCommandFlags = { profile: 'default1' }
		const command = {
			cliConfig: { mergedProfiles },
			flags,
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		stringTranslateToIdMock.mockResolvedValueOnce('profile2')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(outputItemMock).toHaveBeenCalledTimes(1)
		const outputItemConfig = outputItemMock.mock.calls[0][1] as TableCommonOutputProducer<Profile>
		const fieldDefinition = outputItemConfig.tableFieldDefinitions[2] as ValueTableFieldDefinition<Profile>
		const valueFunction = fieldDefinition.value

		expect(fieldDefinition.label).toBe('Definition')
		expect(valueFunction(profile1WithName)).toBe('key1: value1\nkey2: false\n')
	})

	it('displays config file info in common output mode config list', async () => {
		const inputArgv = { profile: 'profile1', verbose: false } as ArgumentsCamelCase<CommandArgs>
		const command = {
			cliConfig: { mergedProfiles },
			configDir: 'config-dir',
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValueOnce(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(consoleLogSpy).toHaveBeenCalledWith(
			'The CLI configuration file on your machine is:\n    config-dir|config.yaml\n',
		)
	})
})
