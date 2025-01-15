import { jest } from '@jest/globals'

import type { ArgumentsCamelCase } from 'yargs'

import {
	type ApiOnlyAppRequest,
	AppClassification,
	type AppCreateRequest,
	type AppResponse,
	type AppsEndpoint,
	AppTargetStatus,
	AppType,
	type AppUISettings,
	type AppUpdateRequest,
	type IconImage,
	type LambdaSmartApp,
	OwnerType,
	PrincipalType,
} from '@smartthings/core-sdk'

import type { httpsURLValidate } from '../../../../lib/validate-util.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { InputAndOutputItemFlags } from '../../../../lib/command/input-and-output-item.js'
import type {
	arrayDef,
	objectDef,
	optionalStringDef,
	staticDef,
	stringDef,
	updateFromUserInput,
} from '../../../../lib/item-input/index.js'
import { buildInputDefMock } from '../../../test-lib/input-type-mock.js'


const httpsURLValidateMock = jest.fn<typeof httpsURLValidate>()
jest.unstable_mockModule('../../../../lib/validate-util.js', () => ({
	httpsURLValidate: httpsURLValidateMock,
}))

const arrayDefMock = jest.fn<typeof arrayDef>()
const objectDefMock = jest.fn<typeof objectDef>()
const optionalStringDefMock = jest.fn<typeof optionalStringDef>()
const staticDefMock = jest.fn<typeof staticDef>()
const stringDefMock = jest.fn<typeof stringDef>()
const updateFromUserInputMock = jest.fn<typeof updateFromUserInput>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	arrayDef: arrayDefMock,
	objectDef: objectDefMock,
	optionalStringDef: optionalStringDefMock,
	staticDef: staticDefMock,
	stringDef: stringDefMock,
	updateFromUserInput: updateFromUserInputMock,
}))

jest.unstable_mockModule('../../../../lib/command//util/apps-util-input-primitives.js', () => ({
	smartAppHelpText: 'smartapp help text',
}))


const {
	getAppUpdateRequestFromUser,
} = await import('../../../../lib/command/util/apps-user-input-update.js')


describe('getAppUpdateRequestFromUser', () => {
	const apiAppsGetMock = jest.fn<typeof AppsEndpoint.prototype.get>()
	const apiAppsUpdateMock = jest.fn<typeof AppsEndpoint.prototype.update>()
	const command = {
		client: {
			apps: {
				get: apiAppsGetMock,
				update: apiAppsUpdateMock,
			},
		},
		flags: {},
	} as unknown as APICommand<ArgumentsCamelCase<InputAndOutputItemFlags>>

	const baseStartingRequest: Omit<AppCreateRequest, 'appType'> = {
		appName: 'starting app name',
		classifications: [AppClassification.AUTOMATION],
		displayName: 'display name',
		description: 'description',
		singleInstance: true,
		iconImage: { url: 'https://icon.example.com' },
		ui: {
			dashboardCardsEnabled: true,
			preInstallDashboardCardsEnabled: false,
		},
	}
	const baseStartingApp: Partial<AppResponse> = {
		appId: 'app-id',
		owner: {
			ownerType: OwnerType.IMPLICIT,
			ownerId: 'owner id',
		},
		singleInstance: true,
		createdDate: 'the day after tomorrow',
		lastUpdatedDate: 'the day before yesterday',
		principalType: PrincipalType.LOCATION,
		installMetadata: {},
	}

	const updatedApp = { appName: 'updated app name' } as AppUpdateRequest
	updateFromUserInputMock.mockResolvedValue(updatedApp)

	const displayNameDefMock = buildInputDefMock<string>('Display Name Mock')
	const descriptionDefMock = buildInputDefMock<string>('Description Mock')
	const appNameDefMock = buildInputDefMock<string>('App Name Mock')
	const appTypeDefMock = buildInputDefMock<string>('App Type Mock')
	const classificationsDefMock = buildInputDefMock<AppClassification[]>('Classifications Mock')
	const singleInstanceDefMock = buildInputDefMock<boolean>('Single Instance Mock')
	const iconImageDefMock = buildInputDefMock<IconImage>('Icon Image URL Mock')
	const uiDefMock = buildInputDefMock<AppUISettings>('UI Mock')

	const mockCommonPropertyInputDefs = (): void => {
		stringDefMock.mockReturnValueOnce(displayNameDefMock)
		stringDefMock.mockReturnValueOnce(descriptionDefMock)
		staticDefMock.mockReturnValueOnce(appNameDefMock)
		staticDefMock.mockReturnValueOnce(appTypeDefMock)
		staticDefMock.mockReturnValueOnce(classificationsDefMock)
		staticDefMock.mockReturnValueOnce(singleInstanceDefMock)
		objectDefMock.mockReturnValueOnce(iconImageDefMock)
		staticDefMock.mockReturnValueOnce(uiDefMock)
	}

	it('starts with request based on app with fields removed, lambda smartapp version', async () => {
		const startingRequest: AppCreateRequest = {
			...baseStartingRequest,
			appType: AppType.LAMBDA_SMART_APP,
			lambdaSmartApp: { functions: ['lambda-function-name'] },
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
		} as AppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockCommonPropertyInputDefs()
		const lambdaFunctionDefMock = buildInputDefMock<string>('Lambda Function Mock')
		stringDefMock.mockReturnValueOnce(lambdaFunctionDefMock)
		const lambdaFunctionsDefMock = buildInputDefMock<string[]>('Lambda Functions Mock')
		arrayDefMock.mockReturnValueOnce(lambdaFunctionsDefMock)
		const lambdaSmartAppDefMock = buildInputDefMock<LambdaSmartApp>('Lambda SmartApp Mock')
		objectDefMock.mockReturnValueOnce(lambdaSmartAppDefMock)
		const appUpdateDefMock = buildInputDefMock<AppUpdateRequest>('App Update Mock')
		objectDefMock.mockReturnValueOnce(appUpdateDefMock)

		expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe(updatedApp)

		expect(apiAppsGetMock).toHaveBeenCalledExactlyOnceWith('app-id')
		expect(stringDefMock).toHaveBeenCalledTimes(3)
		expect(staticDefMock).toHaveBeenCalledTimes(5)
		expect(arrayDefMock).toHaveBeenCalledTimes(1)
		expect(objectDefMock).toHaveBeenCalledTimes(3)

		expect(objectDefMock).toHaveBeenCalledWith(
			'App Update',
			{
				appName: appNameDefMock,
				appType: appTypeDefMock,
				classifications: classificationsDefMock,
				displayName: displayNameDefMock,
				description: descriptionDefMock,
				singleInstance: singleInstanceDefMock,
				iconImage: iconImageDefMock,
				ui: uiDefMock,
				lambdaSmartApp: lambdaSmartAppDefMock,
			},
			{ helpText: 'smartapp help text' },
		)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			appUpdateDefMock,
			startingRequest,
			{ dryRun: false },
		)
	})

	it('handles unspecified iconImage', async () => {
		const startingRequest: AppCreateRequest = {
			...baseStartingRequest,
			appType: AppType.LAMBDA_SMART_APP,
			lambdaSmartApp: { functions: ['lambda-function-name'] },
			iconImage: {},
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
			iconImage: undefined,
		} as AppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockCommonPropertyInputDefs()
		const lambdaFunctionDefMock = buildInputDefMock<string>('Lambda Function Mock')
		stringDefMock.mockReturnValueOnce(lambdaFunctionDefMock)
		const lambdaFunctionsDefMock = buildInputDefMock<string[]>('Lambda Functions Mock')
		arrayDefMock.mockReturnValueOnce(lambdaFunctionsDefMock)
		const lambdaSmartAppDefMock = buildInputDefMock<LambdaSmartApp>('Lambda SmartApp Mock')
		objectDefMock.mockReturnValueOnce(lambdaSmartAppDefMock)
		const appUpdateDefMock = buildInputDefMock<AppUpdateRequest>('App Update Mock')
		objectDefMock.mockReturnValueOnce(appUpdateDefMock)

		expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe(updatedApp)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			appUpdateDefMock,
			startingRequest,
			{ dryRun: false },
		)
	})

	it('starts with request based on app with fields removed, webhook smartapp version', async () => {
		const startingRequest: AppCreateRequest = {
			...baseStartingRequest,
			appType: AppType.WEBHOOK_SMART_APP,
			webhookSmartApp: { targetUrl: 'https://target-url.example.com' },
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
		} as AppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockCommonPropertyInputDefs()
		const targetURLDefMock = buildInputDefMock<string>('Target URL Mock')
		stringDefMock.mockReturnValueOnce(targetURLDefMock)
		const webhookSmartAppDefMock = buildInputDefMock<LambdaSmartApp>('Webhook SmartApp Mock')
		objectDefMock.mockReturnValueOnce(webhookSmartAppDefMock)
		const appUpdateDefMock = buildInputDefMock<AppUpdateRequest>('App Update Mock')
		objectDefMock.mockReturnValueOnce(appUpdateDefMock)

		expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe(updatedApp)

		expect(apiAppsGetMock).toHaveBeenCalledExactlyOnceWith('app-id')
		expect(stringDefMock).toHaveBeenCalledTimes(3)
		expect(staticDefMock).toHaveBeenCalledTimes(5)
		expect(objectDefMock).toHaveBeenCalledTimes(3)

		expect(objectDefMock).toHaveBeenCalledWith(
			'App Update',
			expect.objectContaining({ webhookSmartApp: webhookSmartAppDefMock }),
			{ helpText: 'smartapp help text' },
		)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			appUpdateDefMock,
			startingRequest,
			{ dryRun: false },
		)
	})

	it('handles unspecified webhook targetUrl', async () => {
		const startingRequest: AppCreateRequest = {
			...baseStartingRequest,
			appType: AppType.WEBHOOK_SMART_APP,
			webhookSmartApp: { targetUrl: '' },
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
			webhookSmartApp: undefined,
		} as AppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockCommonPropertyInputDefs()
		const targetURLDefMock = buildInputDefMock<string>('Target URL Mock')
		stringDefMock.mockReturnValueOnce(targetURLDefMock)
		const webhookSmartAppDefMock = buildInputDefMock<LambdaSmartApp>('Webhook SmartApp Mock')
		objectDefMock.mockReturnValueOnce(webhookSmartAppDefMock)
		const appUpdateDefMock = buildInputDefMock<AppUpdateRequest>('App Update Mock')
		objectDefMock.mockReturnValueOnce(appUpdateDefMock)

		expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe(updatedApp)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			appUpdateDefMock,
			startingRequest,
			{ dryRun: false },
		)
	})

	it('starts with request based on app with fields removed, api-only version', async () => {
		const startingRequest: AppCreateRequest = {
			...baseStartingRequest,
			appType: AppType.API_ONLY,
			apiOnly: { targetUrl: 'https://target-url.example.com' },
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
			apiOnly: { subscription: {
				targetUrl: 'https://target-url.example.com',
				targetStatus: AppTargetStatus.CONFIRMED,
			} },
		} as AppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockCommonPropertyInputDefs()
		const targetURLDefMock = buildInputDefMock<string>('Target URL Mock')
		stringDefMock.mockReturnValueOnce(targetURLDefMock)
		const apiOnlySmartAppDefMock = buildInputDefMock<ApiOnlyAppRequest>('API-Only SmartApp Mock')
		objectDefMock.mockReturnValueOnce(apiOnlySmartAppDefMock)
		const appUpdateDefMock = buildInputDefMock<AppUpdateRequest>('App Update Mock')
		objectDefMock.mockReturnValueOnce(appUpdateDefMock)

		expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe(updatedApp)

		expect(apiAppsGetMock).toHaveBeenCalledExactlyOnceWith('app-id')
		expect(stringDefMock).toHaveBeenCalledTimes(3)
		expect(staticDefMock).toHaveBeenCalledTimes(5)
		expect(objectDefMock).toHaveBeenCalledTimes(3)

		expect(objectDefMock).toHaveBeenCalledWith(
			'App Update',
			expect.objectContaining({ apiOnly: apiOnlySmartAppDefMock }),
			{ helpText: 'smartapp help text' },
		)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			appUpdateDefMock,
			startingRequest,
			{ dryRun: false },
		)
	})

	it('passed dryRun flag on to updateFromUserInputMock', async () => {
		const startingRequest: AppCreateRequest = {
			...baseStartingRequest,
			appType: AppType.API_ONLY,
			apiOnly: { targetUrl: 'https://target-url.example.com' },
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
			apiOnly: { subscription: {
				targetUrl: 'https://target-url.example.com',
				targetStatus: AppTargetStatus.CONFIRMED,
			} },
		} as AppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockCommonPropertyInputDefs()
		const targetURLDefMock = buildInputDefMock<string>('Target URL Mock')
		stringDefMock.mockReturnValueOnce(targetURLDefMock)
		const apiOnlySmartAppDefMock = buildInputDefMock<ApiOnlyAppRequest>('API-Only SmartApp Mock')
		objectDefMock.mockReturnValueOnce(apiOnlySmartAppDefMock)
		const appUpdateDefMock = buildInputDefMock<AppUpdateRequest>('App Update Mock')
		objectDefMock.mockReturnValueOnce(appUpdateDefMock)

		const commandWithDryRun = { ...command, flags: { dryRun: true } } as
			APICommand<ArgumentsCamelCase<InputAndOutputItemFlags>>

		expect(await getAppUpdateRequestFromUser(commandWithDryRun, 'app-id')).toBe(updatedApp)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			commandWithDryRun,
			appUpdateDefMock,
			startingRequest,
			{ dryRun: true },
		)
	})
})
