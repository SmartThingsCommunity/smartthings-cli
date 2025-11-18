import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CommandArgs } from '../../../commands/config/reset.js'
import type { resetManagedConfig } from '../../../lib/cli-config.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { booleanInput } from '../../../lib/user-query.js'
import type {
	SmartThingsCommand,
	smartThingsCommand,
	smartThingsCommandBuilder,
	SmartThingsCommandFlags,
} from '../../../lib/command/smartthings-command.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const resetManagedConfigMock = jest.fn<typeof resetManagedConfig>()
jest.unstable_mockModule('../../../lib/cli-config.js', () => ({
	resetManagedConfig: resetManagedConfigMock,
}))

const booleanInputMock = jest.fn<typeof booleanInput>()
jest.unstable_mockModule('../../../lib/user-query.js', () => ({
	booleanInput: booleanInputMock,
}))

const smartThingsCommandMock = jest.fn<typeof smartThingsCommand>()
const smartThingsCommandBuilderMock = jest.fn<typeof smartThingsCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/smartthings-command.js', () => ({
	smartThingsCommand: smartThingsCommandMock,
	smartThingsCommandBuilder: smartThingsCommandBuilderMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/config/reset.js')


test('builder', () => {
	const {
		yargsMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, CommandArgs>()

	smartThingsCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(smartThingsCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const mockSmartThingsCommand = (profileName: string): [ArgumentsCamelCase<SmartThingsCommandFlags>, SmartThingsCommand] => {
		const inputArgv = { profile: profileName } as ArgumentsCamelCase<SmartThingsCommandFlags>
		const command = {
			cliConfig: {
				profileName,
			},
			profileName,
		} as SmartThingsCommand
		smartThingsCommandMock.mockResolvedValueOnce(command)
		return [inputArgv, command]
	}

	it('resets specified profile', async () => {
		const [inputArgv, command] = mockSmartThingsCommand('hub1')
		booleanInputMock.mockResolvedValueOnce(true)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(smartThingsCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(booleanInputMock).toHaveBeenCalledExactlyOnceWith(
			expect.stringMatching(/Are you sure .* questions for the profile hub1\?/),
			{ default: false },
		)
		expect(resetManagedConfigMock).toHaveBeenCalledExactlyOnceWith(command.cliConfig, 'hub1')
		expect(consoleLogSpy).toHaveBeenCalledWith('Configuration has been reset.')
	})

	it('leaves profile name out of message for default profile', async () => {
		const [inputArgv] = mockSmartThingsCommand('default')
		booleanInputMock.mockResolvedValueOnce(true)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(smartThingsCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(booleanInputMock).toHaveBeenCalledExactlyOnceWith(
			expect.stringMatching(/Are you sure .* questions\?/),
			{ default: false },
		)
	})

	it('does not reset when canceled', async () => {
		const [inputArgv] = mockSmartThingsCommand('default')
		booleanInputMock.mockResolvedValueOnce(false)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(smartThingsCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(booleanInputMock).toHaveBeenCalledExactlyOnceWith(
			expect.stringMatching(/Are you sure .* questions\?/),
			{ default: false },
		)
		expect(consoleLogSpy).toHaveBeenCalledWith('Configuration reset canceled.')

		expect(resetManagedConfigMock).not.toHaveBeenCalled()
	})
})
