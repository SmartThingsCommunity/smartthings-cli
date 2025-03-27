import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CommandArgs } from '../../../commands/schema/authorize.js'
import type { addSchemaPermission } from '../../../lib/aws-util.js'
import type { lambdaAuthBuilder } from '../../../lib/command/common-flags.js'
import type { SmartThingsCommand, smartThingsCommand, smartThingsCommandBuilder, SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const addSchemaPermissionMock = jest.fn<typeof addSchemaPermission>()
jest.unstable_mockModule('../../../lib/aws-util.js', () => ({
	addSchemaPermission: addSchemaPermissionMock,
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


const { default: cmd } = await import('../../../commands/schema/authorize.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: smartThingsCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, CommandArgs>()

	smartThingsCommandBuilderMock.mockReturnValue(smartThingsCommandBuilderArgvMock)
	lambdaAuthBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const command = {} as SmartThingsCommand
	smartThingsCommandMock.mockResolvedValue(command)
	addSchemaPermissionMock.mockResolvedValueOnce('added')

	const inputArgv = {
		profile: 'default',
		arn: 'cmd-line-arn',
		principal: 'cmd-line-principal',
		statement: 'cmd-line-statement',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(smartThingsCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(addSchemaPermissionMock)
		.toHaveBeenCalledExactlyOnceWith('cmd-line-arn', 'cmd-line-principal', 'cmd-line-statement')
})
