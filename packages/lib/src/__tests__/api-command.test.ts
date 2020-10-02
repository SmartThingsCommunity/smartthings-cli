import { Config } from '@oclif/config'
import { APICommand, isIndexArgument } from '../api-command'
import { CLIConfig } from '../cli-config'
import { ClientIdProvider } from '../login-authenticator'
import { v4 as uuidv4 } from 'uuid'


jest.mock('../cli-config')
jest.mock('../logger')
jest.mock('../login-authenticator')


describe('api-command', () => {
	describe('APICommand', () => {
		class testCommand extends APICommand {
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

		let apiCommand: testCommand
		const testConfig = new Config({ root: '' })

		beforeEach(() => {
			apiCommand = new testCommand([], testConfig)
		})

		it('should throw Error when not properly setup', async () => {
			await expect(apiCommand.run()).rejects.toEqual(new Error('APICommand not properly initialized'))
		})

		it('should not throw Error when properly setup', async () => {
			await apiCommand.setup({}, [], {})

			expect(apiCommand.run()).resolves
		})

		it('should set token when passed via flags during setup', async () => {
			const token = uuidv4()
			await apiCommand.setup({}, [], { token: token })

			expect(apiCommand.getToken()).toBe(token)
		})

		it('should set token when passed via profileConfig during setup', async () => {
			const token = uuidv4()
			jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
				return {
					token: token,
				}
			})

			await apiCommand.setup({}, [], {})

			expect(apiCommand.getToken()).toBe(token)
		})

		it('should override default clientIdProvider when set in profileConfig during setup', async () => {
			const testClientId = uuidv4()
			const profileConfig = {
				clientIdProvider: {
					clientId: testClientId,
				},
			}

			jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
				return profileConfig
			})

			await apiCommand.setup({}, [], {})

			expect(apiCommand.getClientIdProvider()).toStrictEqual(profileConfig.clientIdProvider)
		})
	})

	describe('isIndexArgument', () => {
		const matches = ['1', '2', '9', '10', '101', '999']
		const noMatches = ['0', '01', '-1', 'apple', 'apple2', '2spooky4me']

		test.each(matches)('should return true for %s', (match) => {
			expect(isIndexArgument(match)).toBe(true)
		})

		test.each(noMatches)('should return false for %s', (noMatch) => {
			expect(isIndexArgument(noMatch)).toBe(false)
		})
	})
})
