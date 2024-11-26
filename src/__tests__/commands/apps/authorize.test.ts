import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CommandArgs } from '../../../commands/apps/authorize.js'
import { addPermission } from '../../../lib/aws-util.js'
import type { lambdaAuthBuilder, LambdaAuthFlags } from '../../../lib/command/common-flags.js'
import type {
	smartThingsCommand,
	smartThingsCommandBuilder,
	SmartThingsCommandFlags,
} from '../../../lib/command/smartthings-command.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const addPermissionMock = jest.fn<typeof addPermission>()
	.mockResolvedValue('permissions updated')
jest.unstable_mockModule('../../../lib/aws-util.js', () => ({
	addPermission: addPermissionMock,
}))

const lambdaAuthBuilderMock = jest.fn<typeof lambdaAuthBuilder>()
jest.unstable_mockModule('../../../lib/command/common-flags.js', () => ({
	lambdaAuthBuilder: lambdaAuthBuilderMock,
}))

const smartThingsCommandMock = jest.fn<typeof smartThingsCommand>()
const smartThingsCommandBuilderMock = jest.fn<typeof smartThingsCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/smartthings-command.js', () => ({
	smartThingsCommand: smartThingsCommandMock,
	smartThingsCommandBuilder: smartThingsCommandBuilderMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/apps/authorize.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: smartThingsCommandBuilderArgvMock,
		positionalMock,
		epilogMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, LambdaAuthFlags>()

	smartThingsCommandBuilderMock.mockReturnValue(smartThingsCommandBuilderArgvMock)
	lambdaAuthBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const inputArgv =
		{ profile: 'default', arn: 'arn' } as ArgumentsCamelCase<CommandArgs>

	it('calls addPermission with specified ARN', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(addPermissionMock)
			.toHaveBeenCalledExactlyOnceWith('arn', undefined, undefined)
		expect(consoleLogSpy).toHaveBeenCalledWith('permissions updated')
	})

	it('passes on principal and statement', async () => {
		await expect(cmd.handler(
			{ ...inputArgv, principal: 'principal', statement: 'statement' },
		)).resolves.not.toThrow()

		expect(addPermissionMock)
			.toHaveBeenCalledExactlyOnceWith('arn', 'principal', 'statement')
	})
})
