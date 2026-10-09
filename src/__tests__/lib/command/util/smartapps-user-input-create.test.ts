import { jest } from '@jest/globals'

import type { v4 as uuid } from 'uuid'

import type {
	ApiOnlySmartAppRequest,
	SmartAppCreateRequest,
	SmartAppOAuthRequest,
	IconImage,
} from '@smartthings/core-sdk'

import type { sanitize } from '../../../../lib/util.js'
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
} from '../../../../lib/command/util/smartapps-user-input-create.js'
import { buildInputDefMock } from '../../../test-lib/input-type-mock.js'


const uuidMock = jest.fn<typeof uuid>().mockReturnValue('generated-uuid' as unknown as Uint8Array<ArrayBufferLike>)
jest.unstable_mockModule('uuid', () => ({
	v4: uuidMock,
}))

const sanitizeMock = jest.fn<typeof sanitize>()
	.mockReturnValue('sanitized')
jest.unstable_mockModule('../../../../lib/util.js', () => ({
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
const corsDomainsDefMock = buildInputDefMock('CORS Domains Mock')
jest.unstable_mockModule('../../../../lib/command/util/smartapps-input-primitives.js', () => ({
	oauthAppScopeDef: oauthAppScopeDefMock,
	redirectUrisDef: redirectUrisDefMock,
	corsDomainsDef: corsDomainsDefMock,
	smartAppHelpText: 'smartapp help text',
}))

jest.spyOn(console, 'error').mockImplementation(() => { /* do nothing */ })

const appNameDefMock = buildInputDefMock('App Name Mock')
const clientNameDefMock = buildInputDefMock('Client Name Mock')
const iconImageDefMock = buildInputDefMock<Required<IconImage>>('Icon Image URL Mock')
const apiOnlyDefMock = buildInputDefMock<ApiOnlySmartAppRequest>('API Only Mock')
const oauthDefMock = buildInputDefMock<Partial<SmartAppOAuthRequest>>('OAuth Mock')
const oauthAppCreateRequestDefMock = buildInputDefMock<SmartAppCreateRequest>('API Access Smart App Mock')


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

	getAppCreateRequestFromUser = (await import('../../../../lib/command/util/smartapps-user-input-create.js'))
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

	it('creates an api-access app', async () => {
		const appRequest = { appName: 'App Name' } as SmartAppCreateRequest

		createFromUserInputMock.mockResolvedValueOnce(appRequest)

		expect(await getAppCreateRequestFromUser(command)).toBe(appRequest)

		expect(createFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ name: 'API Access Smart App Mock' }),
			{ dryRun: false },
		)
	})
})
