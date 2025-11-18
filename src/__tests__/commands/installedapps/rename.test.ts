import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { InstalledApp, InstalledAppsEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/installedapps/rename.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { WithNamedLocation } from '../../../lib/api-helpers.js'
import type { stringInput } from '../../../lib/user-query.js'
import type { APICommand } from '../../../lib/command/api-command.js'
import type { formatAndWriteItem, formatAndWriteItemBuilder } from '../../../lib/command/format.js'
import type { BuildOutputFormatterFlags } from '../.././../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { tableFieldDefinitions } from '../../../lib/command/util/installedapps-table.js'
import type { chooseInstalledAppFn } from '../../../lib/command/util/installedapps-util.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const stringInputMock = jest.fn<typeof stringInput>()
jest.unstable_mockModule('../../../lib/user-query.js', () => ({
	stringInput: stringInputMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem<InstalledApp>>()
const formatAndWriteItemBuilderMock = jest.fn<typeof formatAndWriteItemBuilder>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteItemBuilder: formatAndWriteItemBuilderMock,
}))

const chooseInstalledAppFnMock = jest.fn<typeof chooseInstalledAppFn>()
jest.unstable_mockModule('../../../lib/command/util/installedapps-util.js', () => ({
	chooseInstalledAppFn: chooseInstalledAppFnMock,
}))


const { default: cmd } = await import('../../../commands/installedapps/rename.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	formatAndWriteItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(formatAndWriteItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledOnce()
	expect(exampleMock).toHaveBeenCalledOnce()
	expect(buildEpilogMock).toHaveBeenCalledOnce()
	expect(epilogMock).toHaveBeenCalledOnce()
})

describe('handler', () => {
	const updatedApp = { installedAppId: 'installed-app-id', displayName: 'updated' } as InstalledApp
	const apiInstalledAppsUpdateMock = jest.fn<typeof InstalledAppsEndpoint.prototype.update>()
		.mockResolvedValue(updatedApp)

	const command = {
		client: {
			installedApps: {
				update: apiInstalledAppsUpdateMock,
			},
		},
	} as unknown as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)

	const chooseInstalledAppMock = jest.fn<ChooseFunction<InstalledApp & WithNamedLocation>>()
		.mockResolvedValue('chosen-installed-app-id')
	chooseInstalledAppFnMock.mockReturnValue(chooseInstalledAppMock)

	const baseInputArgv = {
		profile: 'default',
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('prompts user for new name', async () => {
		stringInputMock.mockResolvedValueOnce('Prompted New Name')

		const inputArgv = {
			...baseInputArgv,
			location: ['location-filter'],
		}

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseInstalledAppFnMock).toHaveBeenCalledExactlyOnceWith({
			verbose: false,
			listOptions: { locationId: ['location-filter'] },
		})
		expect(chooseInstalledAppMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(stringInputMock).toHaveBeenCalledTimes(1)
		expect(apiInstalledAppsUpdateMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-installed-app-id', { displayName: 'Prompted New Name' })
		expect(formatAndWriteItemMock).toHaveBeenCalledExactlyOnceWith(command, { tableFieldDefinitions }, updatedApp)
	})

	it('renames to new name specified on command line', async () => {
		const inputArgv = {
			...baseInputArgv,
			id: 'id-from-cmd-line',
			newName: 'Cmd Line New Name',
		}

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseInstalledAppFnMock).toHaveBeenCalledExactlyOnceWith({
			verbose: false,
			listOptions: { locationId: undefined },
		})
		expect(chooseInstalledAppMock).toHaveBeenCalledExactlyOnceWith(command, 'id-from-cmd-line')
		expect(apiInstalledAppsUpdateMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-installed-app-id', { displayName: 'Cmd Line New Name' })
		expect(formatAndWriteItemMock).toHaveBeenCalledExactlyOnceWith(command, { tableFieldDefinitions }, updatedApp)
		expect(stringInputMock).not.toHaveBeenCalled()
	})
})
