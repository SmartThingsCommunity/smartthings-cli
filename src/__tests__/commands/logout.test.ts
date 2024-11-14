import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Authenticator } from '@smartthings/core-sdk'

import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { CommandArgs } from '../../commands/locations.js'
import type { fatalError } from '../../lib/util.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock } from '../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../..')

const fatalErrorMock = jest.fn<typeof fatalError>()
jest.unstable_mockModule('../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../commands/logout.js')


test('builder', () => {
	const {
		yargsMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	const logoutMock = jest.fn<Required<Authenticator>['logout']>()
	const authenticatorMock = { logout: logoutMock } as unknown as Authenticator
	const command = {
		authenticator: authenticatorMock,
		profile: {},
		profileName: 'default',
	} as APICommand

	it('logs out of default profile with no arguments', async () => {
		apiCommandMock.mockResolvedValueOnce(command)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(logoutMock).toHaveBeenCalledExactlyOnceWith()
		expect(consoleLogSpy).toHaveBeenCalledWith('logged out')

		expect(fatalErrorMock).not.toHaveBeenCalled()
	})

	it ('errors out if the user specifies a token', async () => {
		apiCommandMock.mockResolvedValueOnce({ ...command, token: 'bearer-token' })

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(fatalErrorMock)
			.toHaveBeenCalledExactlyOnceWith('Cannot log out with a bearer token.')

		expect(logoutMock).not.toHaveBeenCalled()
	})

	it ('errors out if the profile specified a token', async () => {
		apiCommandMock.mockResolvedValueOnce(
			{ ...command, token: 'bearer-token', profile: { token: 'token' } },
		)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(fatalErrorMock)
			.toHaveBeenCalledExactlyOnceWith('Profile default is set up using a bearer token.')

		expect(logoutMock).not.toHaveBeenCalled()
	})
})
