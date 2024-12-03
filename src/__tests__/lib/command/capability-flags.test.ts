import { buildArgvMock } from '../../test-lib/builder-mock.js'


const {
	capabilityIdBuilder,
	capabilityIdOrIndexBuilder,
} = await import('../../../lib/command/capability-flags.js')


test('lambdaAuthBuilder', () => {
	const { argvMock, positionalMock } = buildArgvMock<object>()

	expect(capabilityIdBuilder(argvMock)).toBe(argvMock)

	expect(positionalMock).toHaveBeenCalledTimes(2)
})

test('allOrganizationsBuilder', () => {
	const { argvMock, positionalMock } = buildArgvMock<object>()

	expect(capabilityIdOrIndexBuilder(argvMock)).toBe(argvMock)

	expect(positionalMock).toHaveBeenCalledTimes(2)
})
