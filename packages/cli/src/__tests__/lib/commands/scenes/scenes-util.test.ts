import { selectFromList } from '@smartthings/cli-lib'
import ScenesCommand from '../../../../commands/scenes'
import { chooseScene } from '../../../../lib/commands/scenes/scenes-util'
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

	it('returns scene ID chosen via selectFromList', async () => {
		mockSelectFromList.mockResolvedValueOnce('chosen-scene-id')
		const command = new ScenesCommand([], new Config({ root: '' }))

		expect(await chooseScene(command)).toEqual('chosen-scene-id')
	})

})

