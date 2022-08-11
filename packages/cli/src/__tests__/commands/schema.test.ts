import { ListDataFunction, outputItemOrList } from '@smartthings/cli-lib'
import { SchemaApp, SchemaEndpoint } from '@smartthings/core-sdk'
import SchemaCommand from '../../commands/schema'


describe('SchemaCommand', () => {
	const getSpy = jest.spyOn(SchemaEndpoint.prototype, 'get').mockImplementation()
	const listSpy = jest.spyOn(SchemaEndpoint.prototype, 'list').mockImplementation()

	const outputItemOrListMock = jest.mocked(outputItemOrList)

	it('calls outputItemOrList with correct config', async () => {
		await expect(SchemaCommand.run(['schemaAppId'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toBeCalledWith(
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
					{ prop: 'userEmail', skipEmpty: true },
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

		expect(outputItemOrListMock).toBeCalledWith(
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
		const lambda = {
			endpointAppId: 'lambdaAppId',
			hostingType: 'lambda',
			lambdaArn: 'ARN',
		} as SchemaApp
		const webhook = {
			endpointAppId: 'webhookAppId',
			hostingType: 'webhook',
			webhookUrl: 'URL',
		} as SchemaApp

		listSpy.mockResolvedValueOnce([lambda, webhook])

		await expect(SchemaCommand.run([])).resolves.not.toThrow()

		/* eslint-disable @typescript-eslint/naming-convention */
		const listFunction = outputItemOrListMock.mock.calls[0][3] as ListDataFunction<SchemaApp & { 'ARN/URL': string }>

		const expected = [
			{
				...lambda,
				'ARN/URL': 'ARN',
			},
			{
				...webhook,
				'ARN/URL': 'URL',
			},
		]
		/* eslint-enable @typescript-eslint/naming-convention */

		await expect(listFunction()).resolves.toEqual(
			expect.arrayContaining(expected),
		)
	})

	it('calls correct get endpoint', async () => {
		await expect(SchemaCommand.run([])).resolves.not.toThrow()

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		const schemaApp = { endpointAppId: 'schemaAppId' } as SchemaApp
		getSpy.mockResolvedValueOnce(schemaApp)

		await expect(getFunction('schemaAppId')).resolves.toStrictEqual(schemaApp)
		expect(getSpy).toBeCalledWith('schemaAppId')
	})
})
