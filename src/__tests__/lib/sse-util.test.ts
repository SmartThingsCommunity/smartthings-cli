import { jest } from '@jest/globals'

import { handleSignals, sseSignals } from '../../lib/sse-util.js'


test('handleSignals adds handler for all required Signals', () => {
	const handler = jest.fn()

	handleSignals(handler)

	sseSignals.forEach(signal => {
		expect(process.listeners(signal)).toContain(handler)
	})
})
