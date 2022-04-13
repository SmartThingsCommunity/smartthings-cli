import { Config } from '@oclif/core'
import { SseCommand } from '../sse-command'
import * as sseUtil from '../sse-util'
import EventSource from 'eventsource'


jest.mock('eventsource')
jest.mock('../cli-config')
jest.mock('../logger')

describe('SseCommand', () => {
	class TestCommand extends SseCommand {
		async run(): Promise<void> {
			// eslint-disable-line @typescript-eslint/no-empty-function
		}
	}

	let sseCommand: TestCommand
	const testConfig = new Config({ root: '' })
	const flags = { token: 'token' }

	const handleSignalsSpy = jest.spyOn(sseUtil, 'handleSignals')

	beforeEach(() => {
		sseCommand = new TestCommand([], testConfig)
	})

	it('throws Error when not properly setup', async () => {
		const message = 'SseCommand not initialized properly'

		expect(() => { sseCommand.source }).toThrowError(message)
	})

	it('does not throw Error when source properly setup', async () => {
		await sseCommand.setup({}, [], flags)
		await sseCommand.initSource('localhost')

		expect(() => { sseCommand.source }).not.toThrow()
	})

	it('adds auth header with token to eventsource by default', async () => {
		await sseCommand.setup({}, [], flags)
		await sseCommand.initSource('localhost')

		expect(EventSource).toBeCalledWith(
			'localhost',
			expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${flags.token}` }) }),
		)
	})

	it('accepts source init dict and merges it with defaults', async () => {
		await sseCommand.setup({}, [], flags)

		const initDict = { headers: { 'Cookie': 'test=test' } }
		await sseCommand.initSource('localhost', initDict)

		expect(EventSource).toBeCalledWith(
			'localhost',
			{ headers: { 'User-Agent': expect.any(String), ...initDict.headers } },
		)
	})

	it('registers signal handler on initialization', async () => {
		await sseCommand.init()

		expect(handleSignalsSpy).toBeCalled()
	})

	it('sets default error handler', async () => {
		await sseCommand.setup({}, [], flags)
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
