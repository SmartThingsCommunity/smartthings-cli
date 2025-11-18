import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { type SchemaApp, type SchemaEndpoint, SuccessStatusValue } from '@smartthings/core-sdk'

import { CommandArgs } from '../../../commands/schema/update.js'
import type { addSchemaPermission } from '../../../lib/aws-util.js'
import { buildEpilog } from '../../../lib/help.js'
import type { cancelCommand, fatalError } from '../../../lib/util.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type { lambdaAuthBuilder } from '../../../lib/command/common-flags.js'
import type { inputAndOutputItemBuilder } from '../../../lib/command/input-and-output-item.js'
import type { inputItem } from '../../../lib/command/input-item.js'
import type { InputProcessor, userInputProcessor } from '../../../lib/command/input-processor.js'
import { OutputFormatter, type writeOutput } from '../../../lib/command/output.js'
import type { buildOutputFormatter } from '../../../lib/command/output-builder.js'
import type {
	chooseSchemaApp,
	getSchemaAppEnsuringOrganization,
	getSchemaAppUpdateFromUser,
	SchemaAppWithOrganization,
} from '../../../lib/command/util/schema-util.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { CLIConfig } from '../../../lib/cli-config.js'



const addSchemaPermissionMock = jest.fn<typeof addSchemaPermission>()
jest.unstable_mockModule('../../../lib/aws-util.js', () => ({
	addSchemaPermission: addSchemaPermissionMock,
}))

const cancelCommandMock = jest.fn<typeof cancelCommand>()
const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../lib/util.js', () => ({
	cancelCommand: cancelCommandMock,
	fatalError: fatalErrorMock,
}))

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

const lambdaAuthBuilderMock = jest.fn<typeof lambdaAuthBuilder>()
jest.unstable_mockModule('../../../lib/command/common-flags.js', () => ({
	lambdaAuthBuilder: lambdaAuthBuilderMock,
}))

const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const inputItemMock = jest.fn<typeof inputItem>()
jest.unstable_mockModule('../../../lib/command/input-item.js', () => ({
	inputItem: inputItemMock,
}))

const userInputProcessorMock = jest.fn<typeof userInputProcessor>()
jest.unstable_mockModule('../../../lib/command/input-processor.js', () => ({
	userInputProcessor: userInputProcessorMock,
}))

const writeOutputMock = jest.fn<typeof writeOutput>()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	writeOutput: writeOutputMock,
}))

const buildOutputFormatterMock = jest.fn<typeof buildOutputFormatter>()
jest.unstable_mockModule('../../../lib/command/output-builder.js', () => ({
	buildOutputFormatter: buildOutputFormatterMock,
}))

const chooseSchemaAppMock = jest.fn<typeof chooseSchemaApp>()
const getSchemaAppEnsuringOrganizationMock = jest.fn<typeof getSchemaAppEnsuringOrganization>()
const getSchemaAppUpdateFromUserMock = jest.fn<typeof getSchemaAppUpdateFromUser>()
jest.unstable_mockModule('../../../lib/command/util/schema-util.js', () => ({
	chooseSchemaApp: chooseSchemaAppMock,
	getSchemaAppEnsuringOrganization: getSchemaAppEnsuringOrganizationMock,
	getSchemaAppUpdateFromUser: getSchemaAppUpdateFromUserMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../commands/schema/update.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: lambdaAuthBuilderArgvMock,
		exampleMock,
		positionalMock,
		optionMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	lambdaAuthBuilderMock.mockReturnValueOnce(lambdaAuthBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(lambdaAuthBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(inputAndOutputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(lambdaAuthBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiSchemaUpdateMock = jest.fn<typeof SchemaEndpoint.prototype.update>()
	const cliConfig = {} as CLIConfig
	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	const command = {
		client: {
			schema: {
				update: apiSchemaUpdateMock,
			},
		},
		flags: inputArgv,
		cliConfig,
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)
	chooseSchemaAppMock.mockResolvedValue('chosen-schema-app-id')

	const schemaApp = {
		endpointAppId: 'schema-app-id',
	} as SchemaApp
	const updatedSchemaApp = {
		endpointAppId: 'updated-schema-app-id',
	} as SchemaApp
	const schemaAppWithOrganization = {
		...schemaApp,
		endpointAppId: 'schema-app-with-organization-id',
		organizationId: 'organization-id',
	} as SchemaAppWithOrganization

	const inputProcessorMock = {
		ioFormat: 'common',
	} as InputProcessor<SchemaAppWithOrganization>
	userInputProcessorMock.mockReturnValue(inputProcessorMock)

	getSchemaAppEnsuringOrganizationMock.mockResolvedValue({ schemaApp, organizationWasUpdated: false })

	it('updates Schema App from user input', async () => {
		inputItemMock.mockResolvedValueOnce([schemaAppWithOrganization, 'common'])
		apiSchemaUpdateMock.mockResolvedValueOnce(SuccessStatusValue)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseSchemaAppMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(getSchemaAppEnsuringOrganizationMock)
			.toHaveBeenCalledExactlyOnceWith(command, 'chosen-schema-app-id', inputArgv)
		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		expect(inputItemMock).toHaveBeenCalledExactlyOnceWith(inputArgv, inputProcessorMock)
		expect(consoleLogSpy).toHaveBeenCalledWith('Schema chosen-schema-app-id updated.')

		expect(buildOutputFormatterMock).not.toHaveBeenCalled()
		expect(writeOutputMock).not.toHaveBeenCalled()
		expect(addSchemaPermissionMock).not.toHaveBeenCalled()
		expect(fatalErrorMock).not.toHaveBeenCalled()

		const getInputFromUser = userInputProcessorMock.mock.calls[0][0]
		getSchemaAppUpdateFromUserMock.mockResolvedValue(updatedSchemaApp)

		expect(await getInputFromUser()).toBe(updatedSchemaApp)

		expect(getSchemaAppUpdateFromUserMock).toHaveBeenCalledExactlyOnceWith(command, schemaApp, false)
	})

	it.each([
		'wwst',
		'cst',
		'review',
	])('cancels command if the Schema App is no longer editable', async certificationStatus => {
		getSchemaAppEnsuringOrganizationMock.mockResolvedValueOnce({
			schemaApp: { ...schemaApp, certificationStatus },
			organizationWasUpdated: false,
		})

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(cancelCommandMock).toHaveBeenCalledExactlyOnceWith('Schema Apps that have already' +
			' been certified cannot be updated via the CLI.')

		expect(inputItemMock).not.toHaveBeenCalled()
		expect(apiSchemaUpdateMock).not.toHaveBeenCalled()
	})

	it('cancels command with modified message if organization was updated', async () => {
		getSchemaAppEnsuringOrganizationMock.mockResolvedValueOnce({
			schemaApp: { ...schemaApp, certificationStatus: 'review' },
			organizationWasUpdated: true,
		})

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(cancelCommandMock).toHaveBeenCalledExactlyOnceWith('Schema Apps that have already' +
			' been certified cannot be updated via the CLI so further updates are not possible.')
	})

	it('writes output in dry-run mode', async () => {
		const argv = { ...inputArgv, dryRun: true, output: 'output-file' }
		const dryRunCommand = {
			...command,
			flags: argv,
		}
		apiOrganizationCommandMock.mockResolvedValueOnce(dryRunCommand)
		inputItemMock.mockResolvedValueOnce([schemaAppWithOrganization, 'common'])
		const outputFormatterMock = jest.fn<OutputFormatter<object>>().mockReturnValueOnce('formatted output')
		buildOutputFormatterMock.mockReturnValueOnce(outputFormatterMock)
		await expect(cmd.handler(argv)).resolves.not.toThrow()

		expect(buildOutputFormatterMock).toHaveBeenCalledExactlyOnceWith(argv, cliConfig, 'common')
		expect(outputFormatterMock).toHaveBeenCalledExactlyOnceWith(schemaAppWithOrganization)
		expect(writeOutputMock).toHaveBeenCalledWith('formatted output', 'output-file')

		expect(apiSchemaUpdateMock).not.toHaveBeenCalled()
	})

	const arnKeys: (keyof SchemaApp)[] = ['lambdaArn', 'lambdaArnAP', 'lambdaArnCN', 'lambdaArnEU']
	it.each(arnKeys)('authorizes when requested', async arnKey => {
		const argv = { ...inputArgv, authorize: true, principal: 'argv-principal', statement: 'argv-statement' }
		const authorizeCommand = {
			...command,
			flags: argv,
		}
		apiOrganizationCommandMock.mockResolvedValueOnce(authorizeCommand)
		const updatedSchemaAppWithArn = {
			...schemaAppWithOrganization,
			hostingType: 'lambda',
			[arnKey]: 'arn-value',
		}
		inputItemMock.mockResolvedValueOnce([updatedSchemaAppWithArn, 'common'])
		apiSchemaUpdateMock.mockResolvedValueOnce(SuccessStatusValue)

		await expect(cmd.handler(argv)).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toHaveBeenCalledWith('arn-value', 'argv-principal', 'argv-statement')
	})

	it('errors when trying to authorize a webhook app', async () => {
		const argv = { ...inputArgv, authorize: true }
		const authorizeCommand = {
			...command,
			flags: argv,
		}
		apiOrganizationCommandMock.mockResolvedValueOnce(authorizeCommand)
		const updatedSchemaAppWithArn = {
			...schemaAppWithOrganization,
			hostingType: 'webhook',
		}
		inputItemMock.mockResolvedValueOnce([updatedSchemaAppWithArn, 'common'])

		await expect(cmd.handler(argv)).resolves.not.toThrow()

		expect(fatalErrorMock)
			.toHaveBeenCalledExactlyOnceWith('Authorization is not applicable to WebHook schema connectors.')

		expect(addSchemaPermissionMock).not.toHaveBeenCalled()
	})

	it('displays error message when update fails', async () => {
		inputItemMock.mockResolvedValueOnce([schemaAppWithOrganization, 'common'])
		apiSchemaUpdateMock.mockResolvedValueOnce({ status: 'error-status' })

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(fatalErrorMock)
			.toHaveBeenCalledExactlyOnceWith('Error error-status updating chosen-schema-app-id.')
	})
})
