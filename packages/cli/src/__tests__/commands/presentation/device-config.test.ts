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
		await expect(DeviceConfigPresentationCommand.run()).rejects.toThrow()
	})

	it('outputs item when required arg is provided', async () => {
		await expect(DeviceConfigPresentationCommand.run(['presentationId'])).resolves.not.toThrow()
		expect(outputItem).toBeCalledTimes(1)
	})
})
