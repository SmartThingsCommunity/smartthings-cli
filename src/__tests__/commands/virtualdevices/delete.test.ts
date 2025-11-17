import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { type Device, DeviceIntegrationType, type DevicesEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/virtualdevices/delete.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand } from '../../../lib/command/api-command.js'
import type { chooseDeviceFn } from '../../../lib/command/util/devices-choose.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const chooseDeviceMock = jest.fn<ChooseFunction<Device>>()
const chooseDeviceFnMock = jest.fn<typeof chooseDeviceFn>().mockReturnValue(chooseDeviceMock)
jest.unstable_mockModule('../../../lib/command/util/devices-choose.js', () => ({
	chooseDeviceFn: chooseDeviceFnMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/virtualdevices/delete.js')


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
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiDevicesDeleteMock = jest.fn<typeof DevicesEndpoint.prototype.delete>()
	chooseDeviceMock.mockResolvedValueOnce('chosen-device-id')
	const command = {
		client: {
			devices: {
				delete: apiDevicesDeleteMock,
			},
		},
	} as unknown as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)
	const inputArgv = { profile: 'default', id: 'command-line-id' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDeviceFnMock).toHaveBeenCalledExactlyOnceWith({ type: DeviceIntegrationType.VIRTUAL })
	expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(command, 'command-line-id')
	expect(apiDevicesDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')
	expect(consoleLogSpy).toHaveBeenCalledWith('Device chosen-device-id deleted.')
})
