import { jest } from '@jest/globals'

import { CLIConfig } from '../../../lib/cli-config.js'
import { APICommand, apiCommand, apiCommandBuilder } from '../../../lib/command/api-command.js'
import { APIOrganizationCommandFlags } from '../../../lib/command/api-organization-command.js'
import { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const stringConfigValueMock = jest.fn<CLIConfig['stringConfigValue']>()
const apiCommandResultMock = {
	configDir: 'test-config-dir',
	cliConfig: {
		stringConfigValue: stringConfigValueMock,
	},
	profileName: 'profile-from-parent',
} as unknown as APICommand
const apiCommandBuilderMock = jest.fn<typeof apiCommandBuilder>()
const apiCommandMock = jest.fn<typeof apiCommand>()
apiCommandMock.mockResolvedValue(apiCommandResultMock)
jest.unstable_mockModule('../../../lib/command/api-command.js', () => ({
	apiCommandBuilder: apiCommandBuilderMock,
	apiCommand: apiCommandMock,
}))

const {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} = await import('../../../lib/command/api-organization-command.js')


test('apiOrganizationCommandBuilder', () => {
	const {
		yargsMock,
		optionMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, APIOrganizationCommandFlags>()
	apiCommandBuilderMock.mockReturnValueOnce(argvMock)

	expect(apiOrganizationCommandBuilder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)

	expect(optionMock).toHaveBeenCalledTimes(1)
})

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
