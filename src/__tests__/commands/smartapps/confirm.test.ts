import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { type PagedSmartApp, type SmartAppsEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/smartapps/confirm.js'
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


const { default: cmd } = await import('../../../commands/smartapps/confirm.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsRegisterMock = jest.fn<typeof SmartAppsEndpoint.prototype.register>()
	const command = {
		client: {
			smartapps: { register: apiAppsRegisterMock },
			// eslint-disable-next-line @typescript-eslint/naming-convention
			config: { headers: { 'X-ST-Organization': 'organization-id' } },
		},
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValueOnce(command)
	chooseSmartAppMock.mockResolvedValueOnce('chosen-id')
	const inputArgv = {
		profile: 'default',
		id: 'id-from-cmd-line',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseSmartAppFnMock)
		.toHaveBeenCalledExactlyOnceWith({ appType: 'API_ONLY', accountId: 'organization-id' })
	expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, 'id-from-cmd-line')
	expect(apiAppsRegisterMock).toHaveBeenCalledExactlyOnceWith('chosen-id')
	expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Confirmation request sent'))
})
