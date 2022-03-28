import inquirer from 'inquirer'

import ConfigResetCommand from '../../../commands/config/reset'

import { resetManagedConfig } from '@smartthings/cli-lib'


jest.mock('inquirer')

jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		resetManagedConfig: jest.fn(),
	}
})

describe('ConfigResetCommand', () => {
	const promptMock = jest.mocked(inquirer.prompt)

	const resetManagedConfigMock = jest.mocked(resetManagedConfig)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('does nothing if user says no to prompt', async () => {
		promptMock.mockResolvedValueOnce({ confirmed: false })

		await expect(ConfigResetCommand.run([])).resolves.not.toThrow()

		expect(resetManagedConfigMock).toHaveBeenCalledTimes(0)
	})

	it('resets config if user says yes to prompt', async () => {
		promptMock.mockResolvedValueOnce({ confirmed: true })

		await expect(ConfigResetCommand.run([])).resolves.not.toThrow()

		expect(resetManagedConfigMock).toHaveBeenCalledTimes(1)
		expect(resetManagedConfigMock).toHaveBeenCalledWith(expect.anything(), 'default')
	})

	it('resets config for alternate profile', async () => {
		promptMock.mockResolvedValueOnce({ confirmed: true })

		await expect(ConfigResetCommand.run(['--profile', 'myProfile'])).resolves.not.toThrow()

		expect(resetManagedConfigMock).toHaveBeenCalledTimes(1)
		expect(resetManagedConfigMock).toHaveBeenCalledWith(expect.anything(), 'myProfile')
	})
})
