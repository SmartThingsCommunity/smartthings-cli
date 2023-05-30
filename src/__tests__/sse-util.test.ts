import { handleSignals, sseSignals } from '../sse-util.js'


describe('sse-util', () => {
	describe('handleSignals', () => {
		it('adds handler for all required Signals', () => {
			const handler = jest.fn()

			handleSignals(handler)

			sseSignals.forEach(signal => {
				expect(process.listeners(signal)).toContain(handler)
			})
		})
	})
})
