import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { SchemaAppRequest, SchemaCreateResponse, SchemaEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/schema/create.js'
import { type addSchemaPermission, schemaAWSPrincipal } from '../../../lib/aws-util.js'
import type { fatalError } from '../../../lib/util.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../lib/command/input-and-output-item.js'
import type { lambdaAuthBuilder } from '../../../lib/command/common-flags.js'
import type { InputProcessor, userInputProcessor } from '../../../lib/command/input-processor.js'
import type {
	getSchemaAppCreateFromUser,
	SchemaAppWithOrganization,
} from '../../../lib/command/util/schema-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const addSchemaPermissionMock = jest.fn<typeof addSchemaPermission>()
jest.unstable_mockModule('../../../lib/aws-util.js', () => ({
	addSchemaPermission: addSchemaPermissionMock,
	schemaAWSPrincipal,
}))

const fatalErrorMock = jest.fn<typeof fatalError>()
	.mockImplementation(() => { throw Error('should exit') })
jest.unstable_mockModule('../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const { apiDocsURLMock } = apiCommandMocks('../../..')

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const lambdaAuthBuilderMock = jest.fn<typeof lambdaAuthBuilder>()
jest.unstable_mockModule('../../../lib/command/common-flags.js', () => ({
	lambdaAuthBuilder: lambdaAuthBuilderMock,
}))

const mockInputProcessor = {
	ioFormat: 'common',
} as InputProcessor<SchemaAppWithOrganization>
const userInputProcessorMock = jest.fn<typeof userInputProcessor>()
	.mockReturnValue(mockInputProcessor)
jest.unstable_mockModule('../../../lib/command/input-processor.js', () => ({
	userInputProcessor: userInputProcessorMock,
}))

const getSchemaAppCreateFromUserMock = jest.fn<typeof getSchemaAppCreateFromUser>()
jest.unstable_mockModule('../../../lib/command/util/schema-util.js', () => ({
	getSchemaAppCreateFromUser: getSchemaAppCreateFromUserMock,
}))


const { default: cmd } = await import('../../../commands/schema/create.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: lambdaAuthBuilderArgvMock,
		exampleMock,
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

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiSchemaCreateMock = jest.fn<typeof SchemaEndpoint.prototype.create>()
	const command = {
		client: {
			schema: {
				create: apiSchemaCreateMock,
			},
		},
	} as unknown as APIOrganizationCommand<CommandArgs>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default', authorize: false } as ArgumentsCamelCase<CommandArgs>

	it('calls inputAndOutputItem with correct config', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			{ tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] },
			expect.any(Function),
			mockInputProcessor,
		)
	})

	it('calls correct create endpoint', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const schemaCreateResponse: SchemaCreateResponse = {
			stClientId: 'clientId',
			stClientSecret: 'clientSecret',
		}
		apiSchemaCreateMock.mockResolvedValueOnce(schemaCreateResponse)

		const schemaAppRequest = {
			appName: 'schemaApp',
		} as SchemaAppRequest
		const schemaAppRequestWithOrganization = {
			...schemaAppRequest,
			organizationId: 'organization-id',
		} as SchemaAppWithOrganization

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		expect(await actionFunction(undefined, schemaAppRequestWithOrganization))
			.toStrictEqual(schemaCreateResponse)
		expect(apiSchemaCreateMock)
			.toHaveBeenCalledExactlyOnceWith(schemaAppRequest, 'organization-id')
	})

	it('accepts authorize flag and adds permissions for each lambda app region', async () => {
		await expect(cmd.handler({ ...inputArgv, authorize: true })).resolves.not.toThrow()

		const schemaCreateResponse: SchemaCreateResponse = {
			stClientId: 'clientId',
			stClientSecret: 'clientSecret',
		}
		apiSchemaCreateMock.mockResolvedValueOnce(schemaCreateResponse)

		const schemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
			lambdaArn: 'lambdaArn',
			lambdaArnCN: 'lambdaArnCN',
			lambdaArnEU: 'lambdaArnEU',
			lambdaArnAP: 'lambdaArnAP',
		} as SchemaAppRequest

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		expect(await actionFunction(undefined, schemaAppRequest)).toBe(schemaCreateResponse)

		expect(addSchemaPermissionMock).toHaveBeenCalledTimes(4)
		expect(addSchemaPermissionMock)
			.toHaveBeenCalledWith(schemaAppRequest.lambdaArn, schemaAWSPrincipal, undefined)
		expect(addSchemaPermissionMock)
			.toHaveBeenCalledWith(schemaAppRequest.lambdaArnCN, schemaAWSPrincipal, undefined)
		expect(addSchemaPermissionMock)
			.toHaveBeenCalledWith(schemaAppRequest.lambdaArnEU, schemaAWSPrincipal, undefined)
		expect(addSchemaPermissionMock)
			.toHaveBeenCalledWith(schemaAppRequest.lambdaArnAP, schemaAWSPrincipal, undefined)
		expect(apiSchemaCreateMock).toHaveBeenCalledExactlyOnceWith(schemaAppRequest, undefined)
	})

	it('logs error if authorize flag is used on non-lambda app', async () => {
		await expect(cmd.handler({ ...inputArgv, authorize: true })).resolves.not.toThrow()

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		const schemaAppRequest = { hostingType: 'webhook' } as SchemaAppRequest

		await expect(actionFunction(undefined, schemaAppRequest)).rejects.toThrow('should exit')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			'Authorization is not applicable to WebHook schema connectors',
		)
		expect(apiSchemaCreateMock).not.toHaveBeenCalled()
	})

	it('ignores authorize flag for lambda apps with no ARNs', async () => {
		await expect(cmd.handler({ ...inputArgv, authorize: true })).resolves.not.toThrow()

		const schemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
		} as SchemaAppRequest

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.not.toThrow()

		expect(addSchemaPermissionMock).not.toHaveBeenCalled()
		expect(apiSchemaCreateMock).toHaveBeenCalledExactlyOnceWith(schemaAppRequest, undefined)
	})

	it('passes principal flag to addSchemaPermission', async () => {
		await expect(cmd.handler({ ...inputArgv, authorize: true, principal: 'principal' }))
			.resolves.not.toThrow()

		const schemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
			lambdaArn: 'lambdaArn',
		} as SchemaAppRequest

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.not.toThrow()

		expect(addSchemaPermissionMock)
			.toHaveBeenCalledExactlyOnceWith(schemaAppRequest.lambdaArn, 'principal', undefined)
	})

	it('passes statement-id flag to addSchemaPermission', async () => {
		await expect(cmd.handler({ ...inputArgv, authorize: true, statement: 'statement-id' }))
			.resolves.not.toThrow()

		const schemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
			lambdaArn: 'lambdaArn',
		} as SchemaAppRequest

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toHaveBeenCalledExactlyOnceWith(
			schemaAppRequest.lambdaArn,
			schemaAWSPrincipal,
			'statement-id',
		)
	})

	it('uses getSchemaAppCreateFromUser to build schema app from user input', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		const inputUser = userInputProcessorMock.mock.calls[0][0]

		await inputUser()
		expect(getSchemaAppCreateFromUserMock).toHaveBeenCalledExactlyOnceWith(command, false)
	})

	it('passes dryRun to getSchemaAppCreateFromUser', async () => {
		await expect(cmd.handler({ ...inputArgv, dryRun: true })).resolves.not.toThrow()

		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		const inputUser = userInputProcessorMock.mock.calls[0][0]

		await inputUser()
		expect(getSchemaAppCreateFromUserMock).toHaveBeenCalledExactlyOnceWith(command, true)
	})
})
