import { jest } from '@jest/globals'

import { APICommand, apiCommand, apiCommandBuilder } from '../../../lib/command/api-command.js'
import { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'


const stringConfigValueMock: jest.Mock<SmartThingsCommand['stringConfigValue']> = jest.fn()
const apiCommandResultMock = {
	configDir: 'test-config-dir',
	profileName: 'profile-from-parent',
	stringConfigValue: stringConfigValueMock,
} as unknown as APICommand
const apiCommandMock: jest.Mock<typeof apiCommand> = jest.fn()
apiCommandMock.mockResolvedValue(apiCommandResultMock)
jest.unstable_mockModule('../../../lib/command/api-command.js', () => ({
	apiCommandBuilder,
	apiCommand: apiCommandMock,
}))

const { apiOrganizationCommand } = await import('../../../lib/command/api-organization-command.js')


describe('apiOrganizationCommand', () => {
	const flags = { profile: 'cmd-line-profile' }

	it('includes output from "parent" smartThingsCommand', async () => {
		const result = await apiOrganizationCommand(flags)

		expect(result.configDir).toBe('test-config-dir')
		expect(result.profileName).toBe('profile-from-parent')

		expect(apiCommandMock).toHaveBeenCalledTimes(1)
		expect(apiCommandMock).toHaveBeenCalledWith(flags, expect.any(Function))
	})

	describe('addAdditionalHeaders', () => {
		it('adds nothing by default', async () => {
			stringConfigValueMock.mockReturnValueOnce(undefined)

			const result = await apiOrganizationCommand(flags)

			const addHeadersFunc = apiCommandMock.mock.calls[0][1]
			const headers = {}

			addHeadersFunc?.(result, headers)

			expect(headers).toStrictEqual({})
		})

		it('adds organization from config file', async () => {
			stringConfigValueMock.mockReturnValueOnce('config-file-organization')

			const result = await apiOrganizationCommand(flags)

			const addHeadersFunc = apiCommandMock.mock.calls[0][1]
			const headers = {}

			addHeadersFunc?.(result, headers)

			// eslint-disable-next-line @typescript-eslint/naming-convention
			expect(headers).toStrictEqual({ 'X-ST-Organization': 'config-file-organization' })
		})

		it('adds organization from command line', async () => {
			const result = await apiOrganizationCommand({ ...flags, organization: 'cmd-line-organization' })

			const addHeadersFunc = apiCommandMock.mock.calls[0][1]
			const headers = {}

			addHeadersFunc?.(result, headers)

			// eslint-disable-next-line @typescript-eslint/naming-convention
			expect(headers).toStrictEqual({ 'X-ST-Organization': 'cmd-line-organization' })
		})

		it('uses command line over config options', async () => {
			stringConfigValueMock.mockReturnValueOnce('config-file-organization')

			const result = await apiOrganizationCommand({ ...flags, organization: 'cmd-line-organization' })

			const addHeadersFunc = apiCommandMock.mock.calls[0][1]
			const headers = {}

			addHeadersFunc?.(result, headers)

			// eslint-disable-next-line @typescript-eslint/naming-convention
			expect(headers).toStrictEqual({ 'X-ST-Organization': 'cmd-line-organization' })
		})
	})
})
