import { outputItemOrList } from '@smartthings/cli-lib'
import OrganizationsCommand from '../../commands/organizations'
import { OrganizationsEndpoint } from '@smartthings/core-sdk'


const listSpy = jest.spyOn(OrganizationsEndpoint.prototype, 'list').mockImplementation()

describe('OrganizationsCommand', () => {
	const organizationId = 'organizationId'
	const mockOutputListing = jest.mocked(outputItemOrList)

	it('calls outputItemOrList when no id is provided', async () => {
		await expect(OrganizationsCommand.run([])).resolves.not.toThrow()

		expect(mockOutputListing).toBeCalledTimes(1)
		expect(mockOutputListing.mock.calls[0][2]).toBeUndefined()
	})

	it('calls outputItemOrList when id is provided', async () => {
		await expect(OrganizationsCommand.run([organizationId])).resolves.not.toThrow()

		expect(mockOutputListing).toBeCalledTimes(1)
		expect(mockOutputListing.mock.calls[0][2]).toBe(organizationId)
	})

	it('uses correct endpoints for output', async () => {
		mockOutputListing.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction, getFunction) => {
			await listFunction()
			await getFunction(organizationId)
		})

		const getSpy = jest.spyOn(OrganizationsEndpoint.prototype, 'get').mockImplementation()

		await expect(OrganizationsCommand.run([])).resolves.not.toThrow()

		expect(mockOutputListing).toBeCalledWith(
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
