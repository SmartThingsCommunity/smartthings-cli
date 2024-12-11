import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	ScenesEndpoint,
	SceneSummary,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import { tableFieldDefinitions } from '../../lib/command/util/scenes-util.js'
import type { CommandArgs } from '../../commands/scenes.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<SceneSummary>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))


const { default: cmd } = await import('../../commands/scenes.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		optionMock,
		positionalMock,
		exampleMock,
		argvMock,
		epilogMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const scene = { sceneId: 'scene-id' } as SceneSummary
	const sceneList = [scene] as SceneSummary[]

	const apiScenesListMock = jest.fn<typeof ScenesEndpoint.prototype.list>()
		.mockResolvedValue(sceneList)
	const apiScenesGetMock = jest.fn<typeof ScenesEndpoint.prototype.get>()
		.mockResolvedValue(scene)
	const clientMock = {
		scenes: {
			list: apiScenesListMock,
			get: apiScenesGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('lists scenes without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'sceneId',
				tableFieldDefinitions,
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiScenesListMock.mockResolvedValueOnce(sceneList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(sceneList)

		expect(apiScenesListMock).toHaveBeenCalledExactlyOnceWith({ locationId: undefined })
	})

	it('lists details of a specified scene', async () => {
		const inputArgv = {
			...defaultInputArgv,
			idOrIndex: 'scene-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'sceneId' }),
			'scene-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-scene-id')).toStrictEqual(scene)

		expect(apiScenesGetMock).toHaveBeenCalledExactlyOnceWith('chosen-scene-id')
	})
})
