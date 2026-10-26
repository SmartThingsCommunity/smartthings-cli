import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { PagedSmartApp, SmartAppsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/smartapps/delete.js'
import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import type { chooseSmartAppFn } from '../../../lib/command/util/smartapps-choose.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const chooseSmartAppMock = jest.fn<ChooseFunction<PagedSmartApp>>()
const chooseSmartAppFnMock = jest.fn<typeof chooseSmartAppFn>().mockReturnValue(chooseSmartAppMock)
jest.unstable_mockModule('../../../lib/command/util/smartapps-choose.js', () => ({
	chooseSmartAppFn: chooseSmartAppFnMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/smartapps/delete.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<object, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsDeleteMock = jest.fn<typeof SmartAppsEndpoint.prototype.delete>()
	chooseSmartAppMock.mockResolvedValueOnce('chosen-app-id')
	const clientMock = {
		smartapps: {
			delete: apiAppsDeleteMock,
		},
		// eslint-disable-next-line @typescript-eslint/naming-convention
		config: { headers: { 'X-ST-Organization': 'organization-id' } },
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APIOrganizationCommand<APIOrganizationCommandFlags>
	apiOrganizationCommandMock.mockResolvedValue(command)
	const inputArgv = {
		profile: 'default',
		id: 'command-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledTimes(1)
	expect(apiOrganizationCommandMock).toHaveBeenCalledWith(inputArgv)
	expect(chooseSmartAppFnMock).toHaveBeenCalledExactlyOnceWith({ accountId: 'organization-id' })
	expect(chooseSmartAppMock).toHaveBeenCalledTimes(1)
	expect(chooseSmartAppMock).toHaveBeenCalledWith(command, 'command-line-id')
	expect(apiAppsDeleteMock).toHaveBeenCalledTimes(1)
	expect(apiAppsDeleteMock).toHaveBeenCalledWith('chosen-app-id')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('Smart App chosen-app-id deleted.')
})
