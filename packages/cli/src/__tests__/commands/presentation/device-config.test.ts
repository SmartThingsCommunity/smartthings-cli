import DeviceConfigPresentationCommand from '../../../commands/presentation/device-config'
import { outputItem } from '@smartthings/cli-lib'
import { PresentationEndpoint } from '@smartthings/core-sdk'


describe('DeviceConfigPresentationCommand', () => {
	const presentationId = 'presentationId'
	const manufacturerName = 'manufacturerName'
	const mockOutputItem = jest.mocked(outputItem)
	const getPresentationSpy = jest.spyOn(PresentationEndpoint.prototype, 'get').mockImplementation()

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('throws error when required arg missing', async () => {
		await expect(DeviceConfigPresentationCommand.run([])).rejects.toThrow()
	})

	it('outputs item when required arg is provided', async () => {
		await expect(DeviceConfigPresentationCommand.run([presentationId])).resolves.not.toThrow()
		expect(mockOutputItem).toBeCalledTimes(1)
		expect(mockOutputItem).toBeCalledWith(
			expect.any(DeviceConfigPresentationCommand),
			expect.objectContaining({
				buildTableOutput: expect.any(Function),
			}),
			expect.any(Function),
		)

		const getFunction = mockOutputItem.mock.calls[0][2]
		await getFunction()

		expect(getPresentationSpy).toBeCalledWith(presentationId, undefined)
	})

	it('outputs item when required and optional args are provided', async () => {
		await expect(DeviceConfigPresentationCommand.run([presentationId, manufacturerName])).resolves.not.toThrow()
		expect(mockOutputItem).toBeCalledTimes(1)

		const getFunction = mockOutputItem.mock.calls[0][2]
		await getFunction()

		expect(getPresentationSpy).toBeCalledWith(presentationId, manufacturerName)
	})
})
