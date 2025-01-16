import { buildArgvMock } from '../../test-lib/builder-mock.js'


const {
	capabilityIdBuilder,
	capabilityIdOrIndexBuilder,
} = await import('../../../lib/command/capability-flags.js')


test('lambdaAuthBuilder', () => {
	const { argvMock, optionMock, positionalMock } = buildArgvMock<object>()

	expect(capabilityIdBuilder(argvMock)).toBe(argvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
})

test('allOrganizationsBuilder', () => {
	const { argvMock, optionMock, positionalMock } = buildArgvMock<object>()

	expect(capabilityIdOrIndexBuilder(argvMock)).toBe(argvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
})
