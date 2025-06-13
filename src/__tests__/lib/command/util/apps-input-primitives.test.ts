import { jest } from '@jest/globals'

import { localhostOrHTTPSValidate } from '../../../../lib/validate-util.js'
import { arrayDef, checkboxDef, stringDef } from '../../../../lib/item-input/index.js'
import { buildInputDefMock } from '../../../test-lib/input-type-mock.js'


const localhostOrHTTPSValidateMock = jest.fn<typeof localhostOrHTTPSValidate>()
jest.unstable_mockModule('../../../../lib/validate-util.js', () => ({
	localhostOrHTTPSValidate: localhostOrHTTPSValidateMock,
}))

const arrayDefMock = jest.fn<typeof arrayDef>()
const checkboxDefMock = jest.fn<typeof checkboxDef<string>>()
const stringDefMock = jest.fn<typeof stringDef>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	arrayDef: arrayDefMock,
	checkboxDef: checkboxDefMock,
	stringDef: stringDefMock,
}))


const oauthAppScopeDefMock = buildInputDefMock<string[]>('Scopes Mock')
checkboxDefMock.mockReturnValueOnce(oauthAppScopeDefMock)

const redirectUriDefMock = buildInputDefMock<string>('Redirect URI Mock')
stringDefMock.mockReturnValueOnce(redirectUriDefMock)
const redirectUrisDefMock = buildInputDefMock<string[]>('Redirect URIs Mock')
arrayDefMock.mockReturnValueOnce(redirectUrisDefMock)

const {
	oauthAppScopeDef,
	redirectUrisDef,
} = await import('../../../../lib/command/util/apps-input-primitives.js')


expect(oauthAppScopeDef).toBe(oauthAppScopeDefMock)
expect(redirectUrisDef).toBe(redirectUrisDefMock)
expect(arrayDefMock).toHaveBeenCalledExactlyOnceWith(
	'Redirect URIs',
	redirectUriDefMock,
	expect.objectContaining({ minItems: 0 }),
)
const validate = checkboxDefMock.mock.calls[0][2]?.validate

test('oauthAppScopeDef requires at least one scope', () => {
	expect(validate?.([])).toBe('At least one scope is required.')
	expect(validate?.([{ name: 'scope', value: 'scope' }])).toBe(true)
	expect(validate?.([{ name: 'scope1', value: 'scope1' }, { name: 'scope2', value: 'scope2' }])).toBe(true)
})
