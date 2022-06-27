import { outputListing, selectFromList } from '@smartthings/cli-lib'
import ScenesCommand, { chooseScene } from '../../commands/scenes'
import { ScenesEndpoint } from '@smartthings/core-sdk'
import { Config } from '@oclif/core'


const listSpy = jest.spyOn(ScenesEndpoint.prototype, 'list').mockImplementation()

describe('chooseScene', () => {
	const mockSelectFromList = jest.mocked(selectFromList)

	it('calls selectFromList with correct config and endpoint', async () => {
		const command = new ScenesCommand([], new Config({ root: '' }))

		mockSelectFromList.mockImplementationOnce(async (_command, _config, options) => {
			await options.listItems()
			return 'selected-scene-id'
		})

		await chooseScene(command)

		expect(selectFromList).toBeCalledWith(
			command,
			expect.objectContaining({
				itemName: 'scene',
				primaryKeyName: 'sceneId',
				sortKeyName: 'sceneName',
			}),
			expect.objectContaining({ preselectedId: undefined }),
		)

		expect(listSpy).toBeCalledTimes(1)
	})
})

describe('ScenesCommand', () => {
	const mockListing = jest.mocked(outputListing)

	it('calls outputListing when no id is provided', async () => {
		await expect(ScenesCommand.run([])).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][2]).toBeUndefined()
	})

	it('calls outputListing when id is provided', async () => {
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
		await expect(ScenesCommand.run(['--location-id="cmd-line-location-id"'])).resolves.not.toThrow()

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
		await expect(ScenesCommand.run(['--location-id="cmd-line-location-id" --l="cmd-line-location-id-2"'])).resolves.not.toThrow()

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
