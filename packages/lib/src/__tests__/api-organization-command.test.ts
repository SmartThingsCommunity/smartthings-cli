import { Config } from '@oclif/core'
import * as coreSDK from '@smartthings/core-sdk'
import { APIOrganizationCommand } from '../api-organization-command'
import { ClientIdProvider } from '../login-authenticator'


jest.mock('os-locale')
jest.mock('@smartthings/core-sdk')
jest.mock('../cli-config')
jest.mock('../logger')
jest.mock('../login-authenticator')


describe('api-organization-command', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('APIOrganizationCommand', () => {
		class testCommand extends APIOrganizationCommand {
			getToken(): string | undefined {
				return this.token
			}

			getClientIdProvider(): ClientIdProvider {
				return this.clientIdProvider
			}

			async run(): Promise<void> {
				this.client
			}
		}

		let apiOrganizationCommand: testCommand
		const testConfig = new Config({ root: '' })

		beforeEach(() => {
			apiOrganizationCommand = new testCommand([], testConfig)
		})

		it('should pass organization ID header on to client', async () => {
			await apiOrganizationCommand.setup({}, [], { organization: 'an-organization-id' })
			const stClientSpy = jest.spyOn(coreSDK, 'SmartThingsClient')

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['X-ST-Organization', 'an-organization-id'])
		})
	})
})
