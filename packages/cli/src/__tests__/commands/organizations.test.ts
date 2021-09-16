import { v4 as uuid } from 'uuid'
import { outputListing } from '@smartthings/cli-lib'
import OrganizationsCommand from '../../commands/organizations'
import { OrganizationsEndpoint } from '@smartthings/core-sdk'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
		selectFromList: jest.fn(),
	}
})

const listSpy = jest.spyOn(OrganizationsEndpoint.prototype, 'list').mockImplementation()

describe('OrganizationsCommand', () => {
	const mockListing = outputListing as unknown as jest.Mock

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('calls outputListing when no id is provided', async () => {
		await expect(OrganizationsCommand.run()).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][2]).toBeUndefined()
	})

	it('calls outputListing when id is provided', async () => {
		const organizationId = uuid()
		await expect(OrganizationsCommand.run([organizationId])).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][2]).toBe(organizationId)
	})

	it('uses correct endpoints for output', async () => {
		mockListing.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction, getFunction) => {
			await listFunction()
			await getFunction()
		})

		const getSpy = jest.spyOn(OrganizationsEndpoint.prototype, 'get').mockImplementation()

		await expect(OrganizationsCommand.run()).resolves.not.toThrow()

		expect(mockListing).toBeCalledWith(
			expect.any(OrganizationsCommand),
			expect.objectContaining({ primaryKeyName: 'organizationId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		expect(getSpy).toBeCalledTimes(1)
		expect(listSpy).toBeCalledTimes(1)
	})
})
