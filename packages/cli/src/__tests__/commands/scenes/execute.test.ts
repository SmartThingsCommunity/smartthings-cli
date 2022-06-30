import { Errors } from '@oclif/core'
import { ScenesEndpoint, SuccessStatusValue } from '@smartthings/core-sdk'
import { chooseScene } from '../../../lib/commands/scenes-util'
import ScenesExecuteCommand from '../../../commands/scenes/execute'


jest.mock('../../../commands/scenes')
jest.mock('../../../lib/commands/scenes-util')

describe('ScenesExecuteCommand', () => {
	const chooseSceneMock = jest.mocked(chooseScene)
	const executeSpy = jest.spyOn(ScenesEndpoint.prototype, 'execute').mockResolvedValue(SuccessStatusValue)
	ScenesExecuteCommand.prototype['log'] = jest.fn()

	it('allows user to select scene', async () => {
		chooseSceneMock.mockResolvedValueOnce('chosen-scene-id')

		await expect(ScenesExecuteCommand.run([])).resolves.not.toThrow()

		expect(chooseSceneMock).toHaveBeenCalledTimes(1)
		expect(chooseSceneMock).toHaveBeenCalledWith(expect.any(ScenesExecuteCommand), undefined)

		expect(executeSpy).toHaveBeenCalledTimes(1)
		expect(executeSpy).toHaveBeenCalledWith('chosen-scene-id')
	})

	it('use scene id from command line', async () => {
		chooseSceneMock.mockResolvedValueOnce('chosen-scene-id')

		await expect(ScenesExecuteCommand.run(['cmd-line-scene-id'])).resolves.not.toThrow()

		expect(chooseSceneMock).toHaveBeenCalledTimes(1)
		expect(chooseSceneMock).toHaveBeenCalledWith(expect.any(ScenesExecuteCommand), 'cmd-line-scene-id')
		expect(executeSpy).toHaveBeenCalledTimes(1)
		expect(executeSpy).toHaveBeenCalledWith('chosen-scene-id')
	})

	it('throws an error if execution fails', async () => {
		chooseSceneMock.mockResolvedValueOnce('chosen-scene-id')
		executeSpy.mockResolvedValueOnce({ status: 'failure' })

		await expect(ScenesExecuteCommand.run([])).rejects.toThrow(Errors.CLIError)
	})
})
