import { buildArgvMock } from '../../test-lib/builder-mock.js'


const { allOrganizationsBuilder, lambdaAuthBuilder } = await import('../../../lib/command/common-flags.js')

test('lambdaAuthBuilder', () => {
	const { optionMock, argvMock } = buildArgvMock<object>()

	expect(lambdaAuthBuilder(argvMock)).toBe(argvMock)

	expect(optionMock).toHaveBeenCalledTimes(2)
})

test('allOrganizationsBuilder', () => {
	const { optionMock, argvMock } = buildArgvMock<object>()

	expect(allOrganizationsBuilder(argvMock)).toBe(argvMock)

	expect(optionMock).toHaveBeenCalledTimes(1)
})
