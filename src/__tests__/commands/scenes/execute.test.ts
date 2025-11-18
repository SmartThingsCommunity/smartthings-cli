import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { type ScenesEndpoint, SmartThingsClient, SuccessStatusValue } from '@smartthings/core-sdk'

import { CommandArgs } from '../../../commands/scenes/execute.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseScene } from '../../../lib/command/util/scenes-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const chooseSceneMock = jest.fn<typeof chooseScene>()
jest.unstable_mockModule('../../../lib/command/util/scenes-util.js', () => ({
	chooseScene: chooseSceneMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../commands/scenes/execute.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiScenesExecuteMock = jest.fn<typeof ScenesEndpoint.prototype.execute>()
		.mockResolvedValue(SuccessStatusValue)
	const client = {
		scenes: {
			execute: apiScenesExecuteMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client,
	} as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('allows user to select scene', async () => {
		chooseSceneMock.mockResolvedValueOnce('chosen-scene-id')

		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(chooseSceneMock).toHaveBeenCalledExactlyOnceWith(command, undefined)

		expect(apiScenesExecuteMock).toHaveBeenCalledExactlyOnceWith('chosen-scene-id')
		expect(consoleLogSpy).toHaveBeenCalledWith('Scene executed successfully')
	})

	it('use scene id from command line', async () => {
		const inputArgv = { ...defaultInputArgv, id: 'cmd-line-scene-id' }
		chooseSceneMock.mockResolvedValueOnce('chosen-scene-id')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseSceneMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-scene-id')
		expect(apiScenesExecuteMock).toHaveBeenCalledExactlyOnceWith('chosen-scene-id')
		expect(consoleLogSpy).toHaveBeenCalledWith('Scene executed successfully')
	})

	it('logs an error if execution fails', async () => {
		chooseSceneMock.mockResolvedValueOnce('chosen-scene-id')
		apiScenesExecuteMock.mockResolvedValueOnce({ status: 'failure' })

		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith('Error "failure" executing chosen-scene-id.')
	})
})
