import DeviceConfigPresentationCommand from '../../../commands/presentation/device-config'
import { outputItem } from '@smartthings/cli-lib'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItem: jest.fn(),
	}
})

describe('DeviceConfigPresentationCommand', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('throws error when required arg missing', async () => {
		await expect(DeviceConfigPresentationCommand.run([])).rejects.toThrow()
	})

	it('outputs item when required arg is provided', async () => {
		const outputItemMock = outputItem as unknown as jest.Mock<typeof outputItem>
		await expect(DeviceConfigPresentationCommand.run(['presentationId'])).resolves.not.toThrow()
		expect(outputItemMock).toBeCalledTimes(1)
		expect(outputItemMock.mock.calls[0][0].argv[0]).toBe('presentationId')
	})

	it('outputs item when required and optional args are provided', async () => {
		const outputItemMock = outputItem as unknown as jest.Mock<typeof outputItem>
		await expect(DeviceConfigPresentationCommand.run(['presentationId', 'manufacturerName'])).resolves.not.toThrow()
		expect(outputItemMock).toBeCalledTimes(1)
		expect(outputItemMock.mock.calls[0][0].argv[0]).toBe('presentationId')
		expect(outputItemMock.mock.calls[0][0].argv[1]).toBe('manufacturerName')
	})
})
