import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { Rule, RulesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/rules/delete.js'
import type { WithNamedLocation } from '../../../lib/api-helpers.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { chooseRuleFn } from '../../../lib/command/util/rules-choose.js'
import type { getRuleWithLocation } from '../../../lib/command/util/rules-util.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../..')

const chooseRuleMock = jest.fn<ChooseFunction<Rule>>()
const chooseRuleFnMock = jest.fn<typeof chooseRuleFn>().mockReturnValue(chooseRuleMock)
jest.unstable_mockModule('../../../lib/command/util/rules-choose.js', () => ({
	chooseRuleFn: chooseRuleFnMock,
}))

const getRuleWithLocationMock = jest.fn<typeof getRuleWithLocation>()
jest.unstable_mockModule('../../../lib/command/util/rules-util.js', () => ({
	getRuleWithLocation: getRuleWithLocationMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/rules/delete.js')


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

describe('handler', () => {
	const apiRulesDeleteMock = jest.fn<typeof RulesEndpoint.prototype.delete>()
	chooseRuleMock.mockResolvedValue('chosen-rule-id')
	const clientMock = {
		rules: {
			delete: apiRulesDeleteMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const baseInputArgv = { profile: 'default', id: 'cmd-line-id' } as ArgumentsCamelCase<CommandArgs>

	it('looks up location when not specified', async () => {
		getRuleWithLocationMock
			.mockResolvedValueOnce({ locationId: 'looked-up-location-id' } as Rule & WithNamedLocation)

		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(baseInputArgv)
		expect(chooseRuleFnMock).toHaveBeenCalledExactlyOnceWith(undefined)
		expect(chooseRuleMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-id',
			{ promptMessage: 'Select a rule to delete.' },
		)
		expect(getRuleWithLocationMock)
			.toHaveBeenCalledExactlyOnceWith(command.client, 'chosen-rule-id')
		expect(apiRulesDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-rule-id', 'looked-up-location-id')

		expect(consoleLogSpy).toHaveBeenLastCalledWith('Rule chosen-rule-id deleted.')
	})

	it('uses location from command line', async () => {
		const inputArgv = { ...baseInputArgv, location: 'cmd-line-location-id' } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseRuleFnMock).toHaveBeenCalledExactlyOnceWith('cmd-line-location-id')
		expect(apiRulesDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-rule-id', 'cmd-line-location-id')

		expect(getRuleWithLocationMock).not.toHaveBeenCalled()
	})
})
