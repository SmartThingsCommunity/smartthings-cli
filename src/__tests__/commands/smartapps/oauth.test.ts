import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { PagedSmartApp, SmartAppOAuthResponse, SmartAppsEndpoint } from '@smartthings/core-sdk'

import type { buildEpilog } from '../../../lib/help.js'
import type { CommandArgs } from '../../../commands/smartapps/oauth.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type { OutputItemOrListFlags } from '../../../lib/command/listing-io.js'
import type { outputItem, outputItemBuilder } from '../../../lib/command/output-item.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import type { chooseSmartAppFn } from '../../../lib/command/util/smartapps-choose.js'
import { oauthTableFieldDefinitions } from '../../../lib/command/util/smartapps-table.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


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

const outputItemMock = jest.fn<typeof outputItem>()
const outputItemBuilderMock = jest.fn<typeof outputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
	outputItemBuilder: outputItemBuilderMock,
}))

const chooseSmartAppMock = jest.fn<ChooseFunction<PagedSmartApp>>()
const chooseSmartAppFnMock = jest.fn<typeof chooseSmartAppFn>().mockReturnValue(chooseSmartAppMock)
jest.unstable_mockModule('../../../lib/command/util/smartapps-choose.js', () => ({
	chooseSmartAppFn: chooseSmartAppFnMock,
}))


const { default: cmd } = await import('../../../commands/smartapps/oauth.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiOrganizationCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, OutputItemOrListFlags>()

	apiOrganizationCommandBuilderMock.mockReturnValue(apiOrganizationCommandBuilderArgvMock)
	outputItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsGetOauthMock = jest.fn<typeof SmartAppsEndpoint.prototype.getOauth>()
	const command = {
		client: {
			smartapps: {
				getOauth: apiAppsGetOauthMock,
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			config: { headers: { 'X-ST-Organization': 'organization-id' } },
		},
	} as unknown as APIOrganizationCommand<APIOrganizationCommandFlags>

	apiOrganizationCommandMock.mockResolvedValueOnce(command)
	chooseSmartAppMock.mockResolvedValueOnce('chosen-app-id')

	const argv = {
		profile: 'default',
		idOrIndex: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(argv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(argv)
	expect(chooseSmartAppFnMock).toHaveBeenCalledExactlyOnceWith({ accountId: 'organization-id' })
	expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-id', { allowIndex: true })
	expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions: oauthTableFieldDefinitions },
		expect.any(Function),
	)

	const getFunction = outputItemMock.mock.calls[0][2]
	const oauthResponse = { clientName: 'my-client-name' } as SmartAppOAuthResponse
	apiAppsGetOauthMock.mockResolvedValueOnce(oauthResponse)

	expect(await getFunction()).toBe(oauthResponse)

	expect(apiAppsGetOauthMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id')
})
