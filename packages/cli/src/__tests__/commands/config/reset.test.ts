import inquirer from 'inquirer'

import ConfigResetCommand from '../../../commands/config/reset.js'

import { resetManagedConfig, SmartThingsCommand } from '@smartthings/cli-lib'


jest.mock('inquirer')
jest.mock('@oclif/core')


describe('ConfigResetCommand', () => {
	const promptMock = jest.mocked(inquirer.prompt)

	const resetManagedConfigMock = jest.mocked(resetManagedConfig)

	const profileNameSpy = jest.spyOn(SmartThingsCommand.prototype, 'profileName', 'get')

	it('does nothing if user says no to prompt', async () => {
		promptMock.mockResolvedValueOnce({ confirmed: false })

		await expect(ConfigResetCommand.run([])).resolves.not.toThrow()

		expect(resetManagedConfigMock).toHaveBeenCalledTimes(0)
	})

	it('resets config if user says yes to prompt', async () => {
		promptMock.mockResolvedValueOnce({ confirmed: true })
		profileNameSpy.mockReturnValue('default')

		await expect(ConfigResetCommand.run([])).resolves.not.toThrow()

		expect(resetManagedConfigMock).toHaveBeenCalledTimes(1)
		expect(resetManagedConfigMock).toHaveBeenCalledWith(expect.anything(), 'default')

		profileNameSpy.mockRestore()
	})

	it('resets config for alternate profile', async () => {
		promptMock.mockResolvedValueOnce({ confirmed: true })

		await expect(ConfigResetCommand.run(['--profile', 'myProfile'])).resolves.not.toThrow()

		expect(resetManagedConfigMock).toHaveBeenCalledTimes(1)
		expect(resetManagedConfigMock).toHaveBeenCalledWith(expect.anything(), 'myProfile')
	})
})
