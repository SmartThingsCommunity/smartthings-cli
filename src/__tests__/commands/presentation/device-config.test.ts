import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { PresentationDeviceConfig, PresentationEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/presentation/device-config.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { OutputItemOrListFlags } from '../../../lib/command/listing-io.js'
import type { outputItem, outputItemBuilder } from '../../../lib/command/output-item.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { buildTableOutput } from '../../../lib/command/util/presentation-device-config-table.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const outputItemMock = jest.fn<typeof outputItem>()
const outputItemBuilderMock = jest.fn<typeof outputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
	outputItemBuilder: outputItemBuilderMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../lib/command/util/presentation-device-config-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../../commands/presentation/device-config.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, OutputItemOrListFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})


test('handler', async () => {
	const apiPresentationGetMock = jest.fn<typeof PresentationEndpoint.prototype.get>()
	const command = {
		client: {
			presentation: {
				get: apiPresentationGetMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<APICommandFlags>

	apiCommandMock.mockResolvedValueOnce(command)

	const argv = {
		profile: 'default',
		presentationId: 'cmd-line-id',
		manufacturerName: 'cmd-line-manufacturer-name',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(argv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(argv)
	expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ buildTableOutput: expect.any(Function) },
		expect.any(Function),
	)

	const config = outputItemMock.mock.calls[0][1] as CustomCommonOutputProducer<PresentationDeviceConfig>
	const deviceConfig: PresentationDeviceConfig = {
		presentationId: 'presentation-id',
		manufacturerName: 'Acme Smart Lighting',
	}
	buildTableOutputMock.mockReturnValueOnce('table output')

	expect(config.buildTableOutput(deviceConfig)).toBe('table output')

	expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, deviceConfig)


	const getFunction = outputItemMock.mock.calls[0][2]
	apiPresentationGetMock.mockResolvedValueOnce(deviceConfig)

	expect(await getFunction()).toBe(deviceConfig)

	expect(apiPresentationGetMock).toHaveBeenCalledExactlyOnceWith('cmd-line-id', 'cmd-line-manufacturer-name')
})
