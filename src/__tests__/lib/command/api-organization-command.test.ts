describe('apiOrganizationCommand', () => {
	it.todo('calls apiCommand with an addAdditionalHeaders function')
})

/*
describe('APIOrganizationCommand', () => {
	const stClientSpy = jest.spyOn(coreSDK, 'SmartThingsClient')

	class TestCommand extends APIOrganizationCommand<typeof TestCommand.flags> {
		async run(): Promise<void> {
			// eslint-disable-line @typescript-eslint/no-empty-function
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		async parse(options?: Interfaces.Input<any, any>, argv?: string[]): Promise<Interfaces.ParserOutput<any, any, any>> {
			return {
				flags: {},
				args: {},
				argv: [],
				raw: [],
				metadata: { flags: {} },
			}
		}
	}

	const loadConfigMock = jest.mocked(loadConfig)
	const parseSpy = jest.spyOn(TestCommand.prototype, 'parse')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type ParserOutputType = Interfaces.ParserOutput<any, any>

	let apiCommand: TestCommand

	beforeEach(() => {
		apiCommand = new TestCommand([], {} as Config)
		apiCommand.warn = jest.fn()
	})

	it('passes organization flag on to client', async () => {
		parseSpy.mockResolvedValueOnce({ args: {}, flags: { organization: 'organization-id-from-flag' } } as ParserOutputType)
		await apiCommand.init()

		expect(stClientSpy).toHaveBeenCalledTimes(1)

		const configUsed = stClientSpy.mock.calls[0][1]
		expect(configUsed?.headers).toContainEntry(['X-ST-Organization', 'organization-id-from-flag'])
	})

	it('passes organization config on to client', async () => {
		const profile: Profile = { organization: 'organization-id-from-config' }
		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

		await apiCommand.init()

		expect(stClientSpy).toHaveBeenCalledTimes(1)

		const configUsed = stClientSpy.mock.calls[0][1]
		expect(configUsed?.headers).toContainEntry(['X-ST-Organization', 'organization-id-from-config'])
	})

	it('prefers organization flag over config', async () => {
		const profile: Profile = { organization: 'organization-id-from-config' }
		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)
		parseSpy.mockResolvedValueOnce({ args: {}, flags: { organization: 'organization-id-from-flag' } } as ParserOutputType)

		await apiCommand.init()

		expect(stClientSpy).toHaveBeenCalledTimes(1)

		const configUsed = stClientSpy.mock.calls[0][1]
		expect(configUsed?.headers).toContainEntry(['X-ST-Organization', 'organization-id-from-flag'])
	})
})
*/
