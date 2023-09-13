import { Config, Interfaces } from '@oclif/core'
import { SseCommand } from '../sse-command'
import * as sseUtil from '../sse-util'
import EventSource from 'eventsource'


jest.mock('eventsource')

describe('SseCommand', () => {
	class TestCommand extends SseCommand<typeof TestCommand.flags> {
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

	let sseCommand: TestCommand
	const testConfig = new Config({ root: '' })
	const flags = { token: 'token' }

	const handleSignalsSpy = jest.spyOn(sseUtil, 'handleSignals')
	const parseSpy = jest.spyOn(TestCommand.prototype, 'parse')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type ParserOutputType = Interfaces.ParserOutput<any, any>

	beforeEach(() => {
		sseCommand = new TestCommand([], testConfig)
	})

	it('throws Error when not properly setup', async () => {
		const message = 'SseCommand not initialized properly'

		expect(() => { sseCommand.source }).toThrowError(message)
	})

	it('does not throw Error when source properly setup', async () => {
		parseSpy.mockResolvedValueOnce({ args: {}, flags } as ParserOutputType)
		await sseCommand.init()
		await sseCommand.initSource('localhost')

		expect(() => { sseCommand.source }).not.toThrow()
	})

	it('adds auth header with token to eventsource by default', async () => {
		parseSpy.mockResolvedValueOnce({ args: {}, flags } as ParserOutputType)
		await sseCommand.init()
		await sseCommand.initSource('localhost')

		expect(EventSource).toBeCalledWith(
			'localhost',
			expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${flags.token}` }) }),
		)
	})

	it('accepts source init dict and merges it with defaults', async () => {
		parseSpy.mockResolvedValueOnce({ args: {}, flags } as ParserOutputType)
		await sseCommand.init()

		const initDict = { headers: { 'Cookie': 'test=test' } }
		await sseCommand.initSource('localhost', initDict)

		expect(EventSource).toBeCalledWith(
			'localhost',
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ headers: { 'User-Agent': expect.any(String), ...initDict.headers } },
		)
	})

	test('setupSignalHandler', async () => {
		parseSpy.mockResolvedValueOnce({ args: {}, flags } as ParserOutputType)
		sseCommand.setupSignalHandler()

		expect(handleSignalsSpy).toBeCalled()
	})

	it('sets default error handler', async () => {
		parseSpy.mockResolvedValueOnce({ args: {}, flags } as ParserOutputType)
		await sseCommand.init()
		await sseCommand.initSource('localhost')

		expect(sseCommand.source.onerror).toBeDefined()
	})

	it('calls teardown on error', async () => {
		const teardownSpy = jest.spyOn(SseCommand.prototype, 'teardown')
		const error = new Error('something went wrong')

		await expect(sseCommand.catch(error)).rejects.toThrowError(error)
		expect(teardownSpy).toBeCalledTimes(1)
	})
})
