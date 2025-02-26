import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { DevicesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/devices/delete.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { chooseDevice } from '../../../lib/command/util/devices-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../..')

const chooseDeviceMock = jest.fn<typeof chooseDevice>()
jest.unstable_mockModule('../../../lib/command/util/devices-util.js', () => ({
	chooseDevice: chooseDeviceMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/devices/delete.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<object, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiDevicesDeleteMock = jest.fn<typeof DevicesEndpoint.prototype.delete>()
	chooseDeviceMock.mockResolvedValueOnce('chosen-device-id')
	const clientMock = {
		devices: {
			delete: apiDevicesDeleteMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)
	const inputArgv = { profile: 'default', id: 'command-line-id' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(command, 'command-line-id')
	expect(apiDevicesDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('Device chosen-device-id deleted.')
})
