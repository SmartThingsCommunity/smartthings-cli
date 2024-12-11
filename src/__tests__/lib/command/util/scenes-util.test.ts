import { jest } from '@jest/globals'

import type { ScenesEndpoint, SceneSummary, SmartThingsClient } from '@smartthings/core-sdk'

import type { ChooseFunction, createChooseFn } from '../../../../lib/command/util/util-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<SceneSummary>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseSceneFn } = await import('../../../../lib/command/util/scenes-util.js')


test('chooseSceneFn uses correct endpoint to list scenes', async () => {
	const chooseSceneMock = jest.fn<ChooseFunction<SceneSummary>>()
	createChooseFnMock.mockReturnValueOnce(chooseSceneMock)

	const chooseScene = chooseSceneFn()

	expect(chooseScene).toBe(chooseSceneMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'scene' }),
		expect.any(Function),
	)

	const sceneList = [{ sceneId: 'listed-scene-id' } as SceneSummary]
	const apiScenesListMock = jest.fn<typeof ScenesEndpoint.prototype.list>()
		.mockResolvedValueOnce(sceneList)
	const listItems = createChooseFnMock.mock.calls[0][1]
	const client = {
		scenes: {
			list: apiScenesListMock,
		},
	} as unknown as SmartThingsClient

	expect(await listItems(client)).toBe(sceneList)

	expect(apiScenesListMock).toHaveBeenCalledExactlyOnceWith()
})
