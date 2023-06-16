import { ArgumentsCamelCase } from 'yargs'

import { Profile, ProfilesByName } from '../../lib/cli-config'
import { IOFormat } from '../../lib/io-util'
import cmd, { ConfigCommandArgs, ProfileWithName } from '../../commands/config.js'
import { outputItem, outputList } from '../../lib/command/basic-io.js'
import { stringTranslateToId } from '../../lib/command/command-util.js'
import { calculateOutputFormat, writeOutput } from '../../lib/command/output'
import { buildOutputFormatter } from '../../lib/command/output-builder.js'
import { SmartThingsCommand, SmartThingsCommandFlags, smartThingsCommand } from '../../lib/command/smartthings-command'


jest.mock('../../lib/command/basic-io.js')
jest.mock('../../lib/command/command-util.js')
jest.mock('../../lib/command/output')
jest.mock('../../lib/command/output-builder.js')
jest.mock('../../lib/command/smartthings-command')

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

	const outputItemMock = jest.mocked(outputItem<ProfileWithName>).mockResolvedValue(profile1WithName)
	const outputListMock = jest.mocked(outputList<ProfileWithName>).mockResolvedValue([profile1WithName, profile2WithName])
	const stringTranslateToIdMock = jest.mocked(stringTranslateToId).mockResolvedValue('translated-id')
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat).mockReturnValue(IOFormat.COMMON)
	const writeOutputMock = jest.mocked(writeOutput)
	const outputFormatterMock = jest.fn().mockReturnValue('formatted output')
	const buildOutputFormatterMock = jest.mocked(buildOutputFormatter).mockReturnValue(outputFormatterMock)
	const smartThingsCommandMock = jest.mocked(smartThingsCommand)

	it('lists configs without args', async () => {
		const inputArgv = { profile: 'profile1', verbose: false } as ArgumentsCamelCase<ConfigCommandArgs>
		const command = { cliConfig: {
			mergedProfiles,
		} } as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValue(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(smartThingsCommandMock).toHaveBeenCalledTimes(1)
		expect(smartThingsCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(inputArgv)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'name' }),
			expect.any(Function), true)

		const outputListConfig = outputListMock.mock.calls[0][1]
		expect(outputListConfig.listTableFieldDefinitions?.length).toBe(2)

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(outputItemMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatter).toHaveBeenCalledTimes(0)
		expect(writeOutput).toHaveBeenCalledTimes(0)

		const listFunction = outputListMock.mock.calls[0][2]
		expect(await listFunction()).toStrictEqual([profile1WithName, profile2WithName])
	})

	it('lists configs with extra fields when verbose requested', async () => {
		const inputArgv = { profile: 'profile1', verbose: true } as ArgumentsCamelCase<ConfigCommandArgs>
		const command = { cliConfig: {
			mergedProfiles,
		} } as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValue(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(smartThingsCommandMock).toHaveBeenCalledTimes(1)
		expect(smartThingsCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(inputArgv)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'name' }),
			expect.any(Function), true)

		const outputListConfig = outputListMock.mock.calls[0][1]
		expect(outputListConfig.listTableFieldDefinitions?.length).toBe(3)
		expect(outputListConfig.listTableFieldDefinitions?.[2]).toStrictEqual({ path: 'profile.token' })

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(outputItemMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatter).toHaveBeenCalledTimes(0)
		expect(writeOutput).toHaveBeenCalledTimes(0)

		const listFunction = outputListMock.mock.calls[0][2]
		expect(await listFunction()).toStrictEqual([profile1WithName, profile2WithName])
	})

	it('supports JSON or YAML output', async () => {
		const inputArgv = { profile: 'profile1', verbose: false, output: 'output-file.json' } as ArgumentsCamelCase<ConfigCommandArgs>
		const flags: SmartThingsCommandFlags = { profile: 'default1' }
		const command = {
			cliConfig: { mergedProfiles },
			flags,
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValue(command)

		calculateOutputFormatMock.mockReturnValue(IOFormat.JSON)

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
		const inputArgv = { profile: 'profile1', verbose: false, name: 'profile2' } as ArgumentsCamelCase<ConfigCommandArgs>
		const flags: SmartThingsCommandFlags = { profile: 'default1' }
		const command = {
			cliConfig: { mergedProfiles },
			flags,
		} as SmartThingsCommand<SmartThingsCommandFlags>
		smartThingsCommandMock.mockResolvedValue(command)

		calculateOutputFormatMock.mockReturnValue(IOFormat.JSON)
		stringTranslateToIdMock.mockResolvedValue('profile2')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

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
})
