/**
 * @jest-environment jsdom // required due to use of MessageEvent
 */

import { logEvent } from '../sse-io.js'
import { CliUx } from '@oclif/core'


jest.mock('@oclif/core')

describe('sse-io', () => {
	describe('logEvent', () => {
		const event = new MessageEvent('message', { data: '{}' })
		const format = {
			formatString: '%s %s',
			formatArgs: ['one', 'two'],
			time: new Date().toISOString(),
		}

		const formatter = jest.fn(() => {
			return format
		})

		const logSpy = jest.spyOn(CliUx.ux, 'log')

		it('calls formatter function', () => {
			logEvent(event, formatter)

			expect(formatter).toBeCalledTimes(1)
		})

		it('does not call formatter or throw when unable to parse event', () => {
			const badEvent = new MessageEvent('message', { data: '' })
			expect(() => logEvent(badEvent, formatter)).not.toThrow()
			expect(formatter).not.toBeCalled
		})

		it('logs time string as prefix by default', () => {
			const emptyFormat = {
				formatString: '',
				time: new Date().toISOString(),
			}

			const emptyFormatter = jest.fn(() => {
				return emptyFormat
			})

			logEvent(event, emptyFormatter)

			expect(logSpy.mock.calls[0][0]).not.toBe(emptyFormat.formatString)
			expect(logSpy.mock.calls[0][1]).toBe(emptyFormat.time)
		})

		it('logs formatArgs as specified by formatter', () => {
			logEvent(event, formatter)

			expect(logSpy.mock.calls[0][0]).toContain(format.formatString)
			expect(logSpy).toBeCalledWith(expect.anything(), expect.anything(), ...format.formatArgs)
		})
	})
})
