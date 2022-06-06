import { ListDataFunction, outputListing } from '@smartthings/cli-lib'
import { SchemaApp, SchemaEndpoint } from '@smartthings/core-sdk'
import SchemaCommand from '../../commands/schema'


describe('SchemaCommand', () => {
	const getSpy = jest.spyOn(SchemaEndpoint.prototype, 'get').mockImplementation()
	const listSpy = jest.spyOn(SchemaEndpoint.prototype, 'list').mockImplementation()

	const outputListingMock = jest.mocked(outputListing)

	it('calls outputListing with correct config', async () => {
		await expect(SchemaCommand.run(['schemaAppId'])).resolves.not.toThrow()

		expect(outputListingMock).toBeCalledWith(
			expect.any(SchemaCommand),
			expect.objectContaining({
				tableFieldDefinitions: [
					'appName', 'partnerName', 'endpointAppId', 'schemaType', 'hostingType',
					'stClientId', 'oAuthAuthorizationUrl', 'oAuthTokenUrl', 'oAuthClientId',
					'oAuthClientSecret', 'icon', 'icon2x', 'icon3x',
					{ prop: 'lambdaArn', skipEmpty: true },
					{ prop: 'lambdaArnAP', skipEmpty: true },
					{ prop: 'lambdaArnCN', skipEmpty: true },
					{ prop: 'lambdaArnEU', skipEmpty: true },
					{ prop: 'webhookUrl', skipEmpty: true },
				],
				primaryKeyName: 'endpointAppId',
				sortKeyName: 'appName',
				listTableFieldDefinitions: ['appName', 'endpointAppId', 'hostingType'],
			}),
			'schemaAppId',
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('includes URLs and ARNs in output when verbose flag is used', async () => {
		await expect(SchemaCommand.run(['schemaAppId', '--verbose'])).resolves.not.toThrow()

		expect(outputListingMock).toBeCalledWith(
			expect.anything(),
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['ARN/URL']),
			}),
			expect.anything(),
			expect.anything(),
			expect.anything(),
		)
	})

	it('adds ARN/URL to return values for lambda and webhooks', async () => {
		const lambda: SchemaApp = {
			endpointAppId: 'lambdaAppId',
			hostingType: 'lambda',
			lambdaArn: 'ARN',
		}
		const webhook: SchemaApp = {
			endpointAppId: 'webhookAppId',
			hostingType: 'webhook',
			webhookUrl: 'URL',
		}
		listSpy.mockResolvedValueOnce([lambda, webhook])

		await expect(SchemaCommand.run([])).resolves.not.toThrow()

		const listFunction = outputListingMock.mock.calls[0][3] as ListDataFunction<SchemaApp & { 'ARN/URL': string }>

		const expected: SchemaApp & { 'ARN/URL': string }[] = [
			{
				...lambda,
				'ARN/URL': 'ARN',
			},
			{
				...webhook,
				'ARN/URL': 'URL',
			},
		]

		await expect(listFunction()).resolves.toEqual(
			expect.arrayContaining(expected),
		)
	})

	it('calls correct get endpoint', async () => {
		await expect(SchemaCommand.run([])).resolves.not.toThrow()

		const getFunction = outputListingMock.mock.calls[0][4]

		const schemaApp: SchemaApp = { endpointAppId: 'schemaAppId' }
		getSpy.mockResolvedValueOnce(schemaApp)

		await expect(getFunction('schemaAppId')).resolves.toStrictEqual(schemaApp)
		expect(getSpy).toBeCalledWith('schemaAppId')
	})
})
