import { SchemaApp, SchemaEndpoint } from '@smartthings/core-sdk'

import { outputItemOrList, TableCommonListOutputProducer } from '@smartthings/cli-lib'

import SchemaCommand from '../../commands/schema.js'


describe('SchemaCommand', () => {
	const getSpy = jest.spyOn(SchemaEndpoint.prototype, 'get').mockImplementation()
	const listSpy = jest.spyOn(SchemaEndpoint.prototype, 'list').mockImplementation()

	const outputItemOrListMock = jest.mocked(outputItemOrList<SchemaApp>)

	it('calls outputItemOrList with correct config', async () => {
		await expect(SchemaCommand.run(['schemaAppId'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(SchemaCommand),
			expect.objectContaining({
				tableFieldDefinitions: [
					'appName', 'partnerName', 'endpointAppId', 'organizationId', 'schemaType', 'hostingType',
					('stClientId' as keyof SchemaApp), 'oAuthAuthorizationUrl', 'oAuthTokenUrl', 'oAuthClientId',
					'oAuthClientSecret', 'icon', 'icon2x', 'icon3x',
					{ prop: 'lambdaArn', skipEmpty: true },
					{ prop: 'lambdaArnAP', skipEmpty: true },
					{ prop: 'lambdaArnCN', skipEmpty: true },
					{ prop: 'lambdaArnEU', skipEmpty: true },
					{ prop: 'webhookUrl', skipEmpty: true },
					{ prop: 'userEmail', skipEmpty: true },
				],
				primaryKeyName: 'endpointAppId',
				sortKeyName: 'appName',
				listTableFieldDefinitions: ['appName', 'endpointAppId', 'organizationId', 'hostingType'],
			}),
			'schemaAppId',
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('includes URLs and ARNs in output when verbose flag is used', async () => {
		await expect(SchemaCommand.run(['schemaAppId', '--verbose'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining([expect.objectContaining({ label: 'ARN/URL', value: expect.any(Function) })]),
			}),
			'schemaAppId',
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('adds ARN/URL to return values for lambda and webhooks', async () => {
		await expect(SchemaCommand.run(['--verbose'])).resolves.not.toThrow()

		const config = (outputItemOrListMock.mock.calls[0][1] as TableCommonListOutputProducer<SchemaApp>)
		const tableFieldDefinition = config.listTableFieldDefinitions[4] as { value: (input: SchemaApp) => string | undefined }

		expect(tableFieldDefinition).toBeObject()
		const valueFunction = tableFieldDefinition.value

		const lambda = { hostingType: 'lambda', lambdaArn: 'ARN' } as SchemaApp
		expect(valueFunction(lambda)).toBe('ARN')

		const webhook = { hostingType: 'webhook', webhookUrl: 'URL' } as SchemaApp
		expect(valueFunction(webhook)).toBe('URL')
	})

	it('calls correct get endpoint', async () => {
		await expect(SchemaCommand.run([])).resolves.not.toThrow()

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		const schemaApp = { endpointAppId: 'schemaAppId' } as SchemaApp
		getSpy.mockResolvedValueOnce(schemaApp)

		await expect(getFunction('schemaAppId')).resolves.toStrictEqual(schemaApp)
		expect(getSpy).toHaveBeenCalledTimes(1)
		expect(getSpy).toHaveBeenCalledWith('schemaAppId')
	})

	it('calls correct list endpoint', async () => {
		await expect(SchemaCommand.run([])).resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		const schemaApp = { endpointAppId: 'schemaAppId' } as SchemaApp
		listSpy.mockResolvedValueOnce([schemaApp])

		await expect(listFunction()).resolves.toStrictEqual([schemaApp])
		expect(listSpy).toHaveBeenCalledTimes(1)
		// TODO: when converting to yargs add case for testing with this flag set to true
		expect(listSpy).toHaveBeenCalledWith({ includeAllOrganizations: undefined })
	})
})
