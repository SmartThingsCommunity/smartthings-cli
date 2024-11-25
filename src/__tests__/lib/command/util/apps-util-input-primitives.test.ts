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


// This module has no functions. Test to make sure the variables call the correct functions.
// To be honest, this is mostly just to get coverage.
test('module', async () => {
	const oauthAppScopeDefMock = buildInputDefMock<string[]>('Scopes Mock')
	checkboxDefMock.mockReturnValueOnce(oauthAppScopeDefMock)

	const redirectUriDefMock = buildInputDefMock<string>('Redirect URI Mock')
	stringDefMock.mockReturnValueOnce(redirectUriDefMock)
	const redirectUrisDefMock = buildInputDefMock<string[]>('Redirect URIs Mock')
	arrayDefMock.mockReturnValueOnce(redirectUrisDefMock)

	const {
		oauthAppScopeDef,
		redirectUrisDef,
	} = await import('../../../../lib/command/util/apps-util-input-primitives.js')

	expect(oauthAppScopeDef).toBe(oauthAppScopeDefMock)
	expect(redirectUrisDef).toBe(redirectUrisDefMock)
	expect(arrayDefMock).toHaveBeenCalledExactlyOnceWith(
		'Redirect URIs',
		redirectUriDefMock,
		expect.objectContaining({ minItems: 0 }),
	)
})
