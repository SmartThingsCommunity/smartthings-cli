import { outputItemOrList } from '@smartthings/cli-lib'
import ScenesCommand from '../../commands/scenes.js'
import { ScenesEndpoint } from '@smartthings/core-sdk'


const listSpy = jest.spyOn(ScenesEndpoint.prototype, 'list').mockImplementation()

describe('ScenesCommand', () => {
	const mockListing = jest.mocked(outputItemOrList)

	it('calls outputItemOrList when no id is provided', async () => {
		await expect(ScenesCommand.run([])).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][2]).toBeUndefined()
	})

	it('calls outputItemOrList when id is provided', async () => {
		const sceneId = 'sceneId'
		await expect(ScenesCommand.run([sceneId])).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][2]).toBe(sceneId)
	})

	it('uses correct endpoints for output', async () => {
		mockListing.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction, getFunction) => {
			await listFunction()
			await getFunction('chosen-id')
		})

		const getSpy = jest.spyOn(ScenesEndpoint.prototype, 'get').mockImplementation()

		await expect(ScenesCommand.run([])).resolves.not.toThrow()

		expect(mockListing).toBeCalledWith(
			expect.any(ScenesCommand),
			expect.objectContaining({ primaryKeyName: 'sceneId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		expect(getSpy).toBeCalledTimes(1)
		expect(listSpy).toBeCalledTimes(1)
	})

	it('uses one location from command line', async () => {
		await expect(ScenesCommand.run(['--location="cmd-line-location-id"'])).resolves.not.toThrow()

		expect(mockListing).toHaveBeenCalledTimes(1)
		expect(mockListing).toHaveBeenCalledWith(
			expect.any(ScenesCommand),
			expect.objectContaining({ primaryKeyName: 'sceneId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
		expect(mockListing.mock.calls[0][2]).toBeUndefined()
	})

	it('uses multiple locations from command line', async () => {
		await expect(ScenesCommand.run(['--location="cmd-line-location-id" --l="cmd-line-location-id-2"'])).resolves.not.toThrow()

		expect(mockListing).toHaveBeenCalledTimes(1)
		expect(mockListing).toHaveBeenCalledWith(
			expect.any(ScenesCommand),
			expect.objectContaining({ primaryKeyName: 'sceneId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
		expect(mockListing.mock.calls[0][2]).toBeUndefined()
	})
})
