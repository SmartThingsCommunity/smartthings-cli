import { jest } from '@jest/globals'

import type { ArgumentsCamelCase } from 'yargs'

import {
	type ApiOnlySmartAppRequest,
	type SmartAppClassification,
	type SmartAppCreateRequest,
	type SmartAppResponse,
	type SmartAppsEndpoint,
	type SmartAppUISettings,
	type SmartAppUpdateRequest,
	type IconImage,
	OwnerType,
} from '@smartthings/core-sdk'

import type { httpsURLValidate } from '../../../../lib/validate-util.js'
import type { fatalError } from '../../../../lib/util.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { InputAndOutputItemFlags } from '../../../../lib/command/input-and-output-item.js'
import type {
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

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const objectDefMock = jest.fn<typeof objectDef>()
const optionalStringDefMock = jest.fn<typeof optionalStringDef>()
const staticDefMock = jest.fn<typeof staticDef>()
const stringDefMock = jest.fn<typeof stringDef>()
const updateFromUserInputMock = jest.fn<typeof updateFromUserInput>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	objectDef: objectDefMock,
	optionalStringDef: optionalStringDefMock,
	staticDef: staticDefMock,
	stringDef: stringDefMock,
	updateFromUserInput: updateFromUserInputMock,
}))

jest.unstable_mockModule('../../../../lib/command//util/smartapps-input-primitives.js', () => ({
	smartAppHelpText: 'smartapp help text',
}))


const {
	getAppUpdateRequestFromUser,
} = await import('../../../../lib/command/util/smartapps-user-input-update.js')


describe('getAppUpdateRequestFromUser', () => {
	const apiAppsGetMock = jest.fn<typeof SmartAppsEndpoint.prototype.get>()
	const apiAppsUpdateMock = jest.fn<typeof SmartAppsEndpoint.prototype.update>()
	const command = {
		client: {
			smartapps: {
				get: apiAppsGetMock,
				update: apiAppsUpdateMock,
			},
		},
		flags: {},
	} as unknown as APICommand<ArgumentsCamelCase<InputAndOutputItemFlags>>

	const baseStartingRequest: Omit<SmartAppCreateRequest, 'appType' | 'appName'> = {
		classifications: ['AUTOMATION'],
		displayName: 'display name',
		description: 'description',
		singleInstance: true,
		iconImage: { url: 'https://icon.example.com' },
		ui: {
			dashboardCardsEnabled: true,
			preInstallDashboardCardsEnabled: false,
		},
	}
	const baseStartingApp: Partial<SmartAppResponse> = {
		appId: 'app-id',
		owner: {
			ownerType: OwnerType.IMPLICIT,
			ownerId: 'owner id',
		},
		singleInstance: true,
		createdDate: 'the day after tomorrow',
		lastUpdatedDate: 'the day before yesterday',
		principalType: 'LOCATION',
		installMetadata: {},
	}

	const updatedApp = {} as SmartAppUpdateRequest
	updateFromUserInputMock.mockResolvedValue(updatedApp)

	const displayNameDefMock = buildInputDefMock<string>('Display Name Mock')
	const descriptionDefMock = buildInputDefMock<string>('Description Mock')
	const appTypeDefMock = buildInputDefMock<string>('App Type Mock')
	const classificationsDefMock = buildInputDefMock<SmartAppClassification[]>('Classifications Mock')
	const singleInstanceDefMock = buildInputDefMock<boolean>('Single Instance Mock')
	const iconImageDefMock = buildInputDefMock<IconImage>('Icon Image URL Mock')
	const targetURLDefMock = buildInputDefMock<string>('Target URL Mock')
	const apiOnlySmartAppDefMock = buildInputDefMock<ApiOnlySmartAppRequest>('API-Only Smart App Mock')
	const uiDefMock = buildInputDefMock<SmartAppUISettings>('UI Mock')
	const appUpdateDefMock = buildInputDefMock<SmartAppUpdateRequest>('App Update Mock')

	const mockPropertyInputDefs = (): void => {
		stringDefMock.mockReturnValueOnce(displayNameDefMock)
		stringDefMock.mockReturnValueOnce(descriptionDefMock)
		staticDefMock.mockReturnValueOnce(appTypeDefMock)
		staticDefMock.mockReturnValueOnce(classificationsDefMock)
		staticDefMock.mockReturnValueOnce(singleInstanceDefMock)
		objectDefMock.mockReturnValueOnce(iconImageDefMock)
		stringDefMock.mockReturnValueOnce(targetURLDefMock)
		objectDefMock.mockReturnValueOnce(apiOnlySmartAppDefMock)
		staticDefMock.mockReturnValueOnce(uiDefMock)
		objectDefMock.mockReturnValueOnce(appUpdateDefMock)
	}

	it.each(['LAMBDA_SMART_APP', 'WEBHOOK_SMART_APP'] as const)(
		'calls fatalError when appType is %s',
		async (appType) => {
			const startingApp = {
				...baseStartingRequest,
				...baseStartingApp,
				appType,
			} as SmartAppResponse
			apiAppsGetMock.mockResolvedValueOnce(startingApp)

			expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe('never return')

			expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Only API_ONLY apps can be modified.')
			expect(updateFromUserInputMock).not.toHaveBeenCalled()
		},
	)

	it('handles unspecified iconImage', async () => {
		const startingRequest: SmartAppUpdateRequest = {
			...baseStartingRequest,
			appType: 'API_ONLY',
			apiOnly: { targetUrl: 'https://target-url.example.com' },
			iconImage: {},
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
			apiOnly: { subscription: {
				targetUrl: 'https://target-url.example.com',
				targetStatus: 'CONFIRMED',
			} },
			iconImage: undefined,
		} as SmartAppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockPropertyInputDefs()

		expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe(updatedApp)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			appUpdateDefMock,
			startingRequest,
			{ dryRun: false },
		)
	})

	it('starts with request based on app with fields removed, api-only version', async () => {
		const startingRequest: SmartAppUpdateRequest = {
			...baseStartingRequest,
			appType: 'API_ONLY',
			apiOnly: { targetUrl: 'https://target-url.example.com' },
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
			apiOnly: { subscription: {
				targetUrl: 'https://target-url.example.com',
				targetStatus: 'CONFIRMED',
			} },
		} as SmartAppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockPropertyInputDefs()

		expect(await getAppUpdateRequestFromUser(command, 'app-id')).toBe(updatedApp)

		expect(apiAppsGetMock).toHaveBeenCalledExactlyOnceWith('app-id')
		expect(stringDefMock).toHaveBeenCalledTimes(2)
		expect(staticDefMock).toHaveBeenCalledTimes(4)
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
		const startingRequest: SmartAppUpdateRequest = {
			...baseStartingRequest,
			appType: 'API_ONLY',
			apiOnly: { targetUrl: 'https://target-url.example.com' },
		}
		const startingApp = {
			...startingRequest,
			...baseStartingApp,
			apiOnly: { subscription: {
				targetUrl: 'https://target-url.example.com',
				targetStatus: 'CONFIRMED',
			} },
		} as SmartAppResponse
		apiAppsGetMock.mockResolvedValueOnce(startingApp)
		mockPropertyInputDefs()

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
