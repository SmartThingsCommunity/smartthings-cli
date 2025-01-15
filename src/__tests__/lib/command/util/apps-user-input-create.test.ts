import { jest } from '@jest/globals'

import type inquirer from 'inquirer'
import type { v4 as uuid } from 'uuid'

import type {
	ApiOnlyAppRequest,
	AppCreateRequest,
	AppOAuthRequest,
	IconImage,
} from '@smartthings/core-sdk'

import type { cancelCommand, sanitize } from '../../../../lib/util.js'
import type { httpsURLValidate, stringValidateFn } from '../../../../lib/validate-util.js'
import type { InputAndOutputItemFlags } from '../../../../lib/command/input-and-output-item.js'
import type {
	SmartThingsCommand,
	SmartThingsCommandFlags,
} from '../../../../lib/command/smartthings-command.js'
import type {
	computedDef,
	createFromUserInput,
	objectDef,
	optionalStringDef,
	staticDef,
	stringDef,
} from '../../../../lib/item-input/index.js'
import type {
	getAppCreateRequestFromUser as getAppCreateRequestFromUserForType,
} from '../../../../lib/command/util/apps-user-input-create.js'
import { buildInputDefMock } from '../../../test-lib/input-type-mock.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
	},
}))

const uuidMock = jest.fn<typeof uuid>().mockReturnValue('generated-uuid')
jest.unstable_mockModule('uuid', () => ({
	v4: uuidMock,
}))

const cancelCommandMock = jest.fn<typeof cancelCommand>()
const sanitizeMock = jest.fn<typeof sanitize>()
	.mockReturnValue('sanitized')
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	cancelCommand: cancelCommandMock,
	sanitize: sanitizeMock,
}))

const httpsURLValidateMock = jest.fn<typeof httpsURLValidate>()
const stringValidateFnMock = jest.fn<typeof stringValidateFn>()
jest.unstable_mockModule('../../../../lib/validate-util.js', () => ({
	httpsURLValidate: httpsURLValidateMock,
	stringValidateFn: stringValidateFnMock,
}))

const computedDefMock = jest.fn<typeof computedDef>()
const createFromUserInputMock = jest.fn<typeof createFromUserInput>()
const objectDefMock = jest.fn<typeof objectDef>()
const optionalStringDefMock = jest.fn<typeof optionalStringDef>()
const staticDefMock = jest.fn<typeof staticDef>()
const stringDefMock = jest.fn<typeof stringDef>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	computedDef: computedDefMock,
	createFromUserInput: createFromUserInputMock,
	maxItemValueLength: 16,
	objectDef: objectDefMock,
	optionalStringDef: optionalStringDefMock,
	staticDef: staticDefMock,
	stringDef: stringDefMock,
}))

const oauthAppScopeDefMock = buildInputDefMock('Scopes Mock')
const redirectUrisDefMock = buildInputDefMock('Redirect URIs Mock')
jest.unstable_mockModule('../../../../lib/command/util/apps-input-primitives.js', () => ({
	oauthAppScopeDef: oauthAppScopeDefMock,
	redirectUrisDef: redirectUrisDefMock,
	smartAppHelpText: 'smartapp help text',
}))

const appNameDefMock = buildInputDefMock('App Name Mock')
const clientNameDefMock = buildInputDefMock('Client Name Mock')
const iconImageDefMock = buildInputDefMock<Required<IconImage>>('Icon Image URL Mock')
const apiOnlyDefMock = buildInputDefMock<ApiOnlyAppRequest>('API Only Mock')
const oauthDefMock = buildInputDefMock<Partial<AppOAuthRequest>>('OAuth Mock')
const oauthAppCreateRequestDefMock = buildInputDefMock<AppCreateRequest>('OAuth-In SmartApp Mock')


let getAppCreateRequestFromUser: typeof getAppCreateRequestFromUserForType
let appNameDefCompute: Parameters<typeof computedDef>[0]
let clientNameDefCompute: Parameters<typeof computedDef>[0]

test('module initialization', async () => {
	computedDefMock.mockReturnValueOnce(appNameDefMock)
	computedDefMock.mockReturnValueOnce(clientNameDefMock)
	objectDefMock.mockReturnValueOnce(iconImageDefMock)
	objectDefMock.mockReturnValueOnce(apiOnlyDefMock)
	objectDefMock.mockReturnValueOnce(oauthDefMock)
	objectDefMock.mockReturnValueOnce(oauthAppCreateRequestDefMock)

	getAppCreateRequestFromUser = (await import('../../../../lib/command/util/apps-user-input-create.js'))
		.getAppCreateRequestFromUser

	expect(computedDefMock).toHaveBeenCalledTimes(2)
	expect(objectDefMock).toHaveBeenCalledTimes(4)

	appNameDefCompute = computedDefMock.mock.calls[0][0]
	clientNameDefCompute = computedDefMock.mock.calls[1][0]
})

describe('appNameDef compute function', () => {
	it('throws an error for an invalid context', () => {
		expect(() => appNameDefCompute()).toThrow('invalid context for appName computed input definition')
		expect(() => appNameDefCompute([])).toThrow('invalid context for appName computed input definition')
	})

	it('returns sanitized display name', () => {
		expect(appNameDefCompute([{ displayName: 'display name' }])).toBe('sanitized-generated-uuid')
	})

	it('ensures computed value starts with an alphabetic character', () => {
		sanitizeMock.mockReturnValueOnce('-weird name')
		expect(appNameDefCompute([{ displayName: 'display name' }])).toBe('a-weird name-generated-uuid')
	})
})

describe('clientNameDef compute function', () => {
	it('throws an error for an invalid context', () => {
		expect(() => clientNameDefCompute()).toThrow('invalid context for clientName computed input definition')
		expect(() => clientNameDefCompute([{}])).toThrow('invalid context for clientName computed input definition')
		expect(() => clientNameDefCompute([{}, {}, {}])).toThrow('invalid context for clientName computed input definition')
	})

	it('returns displayName', () => {
		expect(clientNameDefCompute([{}, { displayName: 'display name' }])).toBe('display name')
	})
})

describe('getAppCreateRequestFromUser', () => {
	const command = { flags: {} } as SmartThingsCommand<SmartThingsCommandFlags & InputAndOutputItemFlags>

	it('queries user for app for oauth-in app', async () => {
		const appRequest = { appName: 'App Name' } as AppCreateRequest

		promptMock.mockResolvedValueOnce({ action: 'oauth-in' })
		createFromUserInputMock.mockResolvedValueOnce(appRequest)

		expect(await getAppCreateRequestFromUser(command)).toBe(appRequest)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			type: 'list',
			name: 'action',
		}))
		expect(createFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ name: 'OAuth-In SmartApp Mock' }),
			{ dryRun: false },
		)

		expect(cancelCommandMock).not.toHaveBeenCalled()
	})

	it('allows cancel at top level', async () => {
		promptMock.mockResolvedValueOnce({ action: 'cancel' })

		await getAppCreateRequestFromUser(command)

		promptMock.mockResolvedValueOnce({ action: 'oauth-in' })
		expect(cancelCommandMock).toHaveBeenCalledExactlyOnceWith()

		expect(createFromUserInputMock).not.toHaveBeenCalled()
	})
})
