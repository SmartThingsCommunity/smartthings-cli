import { outputItemOrList } from '@smartthings/cli-lib'

import DeviceProfilesCommand from '../../commands/deviceprofiles'


describe('DevicesProfilesCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)

	it('uses simple fields by default', async () => {
		await expect(DeviceProfilesCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DeviceProfilesCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['name', 'status', 'id'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('includes organization with all-organizations flag', async () => {
		await expect(DeviceProfilesCommand.run(['--all-organizations'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DeviceProfilesCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['name', 'status', 'id', 'organization'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})
})
