import { jest } from '@jest/globals'

import { logLevels } from '../../lib/live-logging.js'
import { EventFormatter, type LiveLogMessage } from '../../lib/sse-io.js'


const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const {
	isLiveLogMessage,
	logEvent,
	parseEvent,
} = await import('../../lib/sse-io.js')


/* eslint-disable @typescript-eslint/naming-convention */
const validLiveLogMessage: LiveLogMessage = {
	timestamp: 'timestamp', driver_id: 'driver-id', driver_name: 'driver name', log_level: 5, message: 'message',
}

describe('isLiveLogMessage', () => {
	it.each([
		undefined, null, 'a string', 52.3, {},
		{ ...validLiveLogMessage, timestamp: undefined },
		{ ...validLiveLogMessage, driver_id: undefined },
		{ ...validLiveLogMessage, driver_name: undefined },
		{ ...validLiveLogMessage, log_level: undefined },
		{ ...validLiveLogMessage, log_level: 'not a number!' },
		{ ...validLiveLogMessage, message: undefined },
	])('returns false for invalid event %s', (invalidEvent) => {
		expect(isLiveLogMessage(invalidEvent)).toBeFalsy()
	})

	it('returns true if it is valid', () => {
		expect(isLiveLogMessage(validLiveLogMessage)).toBeTrue()
	})
})

describe('parseEvent', () => {
	const errorEvent: LiveLogMessage = {
		timestamp: 'event timestamp',
		driver_id: 'driver-id',
		driver_name: 'Driver',
		log_level: logLevels.error.value,
		message: 'Something bad happened.',
	}
	const messageString = JSON.stringify(errorEvent)

	it('parses proper MessageEvent data', () => {
		expect(parseEvent({ data: messageString } as MessageEvent)).toStrictEqual(errorEvent)
	})

	it('throws error for unparsable event', () => {
		expect(() => parseEvent({ data: '{ "invalid' } as MessageEvent))
			.toThrow('Unable to parse received event { "invalid.')
	})

	it('throws error for valid JSON but invalid event', () => {
		expect(() => parseEvent({ data: '"valid JSON"' } as MessageEvent))
			.toThrow('Unable to parse received event "valid JSON"')
	})
})

describe('logEvent', () => {
	const formatterMock = jest.fn<EventFormatter>()
	const message: LiveLogMessage = {
		driver_id: 'driver-id',
		driver_name: 'Driver Name',
		log_level: logLevels.debug.value,
		message: 'the blorp blooped when it should have blopped',
		timestamp: 'tomorrow',
	}

	const eventFormat = {
		formatString: 'format-string',
		time: 'tomorrow',
	}

	it('includes time alone as an argument when formatter finds no others', () => {
		formatterMock.mockReturnValueOnce(eventFormat)

		logEvent(message, formatterMock)

		expect(formatterMock).toHaveBeenCalledExactlyOnceWith(message)
		expect(consoleLogSpy).toHaveBeenCalledWith('%s format-string', 'tomorrow')
	})

	it('includes args found by formatter after time', () => {
		formatterMock.mockReturnValueOnce({ ...eventFormat, formatArgs: ['one arg', 'two arg'] })

		logEvent(message, formatterMock)

		expect(formatterMock).toHaveBeenCalledExactlyOnceWith(message)
		expect(consoleLogSpy).toHaveBeenCalledWith('%s format-string', 'tomorrow', 'one arg', 'two arg')
	})
})
/* eslint-enable @typescript-eslint/naming-convention */
