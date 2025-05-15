export type LiveLogMessage = {
	/*
	 * The ISO formatted Local timestamp
	 */
	timestamp: string

	/**
	 * A UUID for this driver
	 */
	driver_id: string

	/**
	 * The human readable name of this driver
	 */
	driver_name: string

	/**
	 * The level this message is logged at
	 */
	log_level: number

	/**
	 * The content of this message
	 */
	message: string
}

export const isLiveLogMessage = (event: unknown): event is LiveLogMessage => {
	const liveLogEvent = event as LiveLogMessage
	return liveLogEvent && typeof liveLogEvent === 'object' &&
		typeof liveLogEvent.timestamp === 'string' &&
		typeof liveLogEvent.driver_id === 'string' &&
		typeof liveLogEvent.driver_name === 'string' &&
		typeof liveLogEvent.log_level === 'number' &&
		typeof liveLogEvent.message === 'string'
}

/**
 * This controls how every Server-sent event is formatted to the console in the CLI.
 */
const formatTimePrefix = '%s '

export type EventFormat = {
	/**
	 * A printf-like format string which can contain zero or more format specifiers.
	 */
	formatString: string

	/**
	 * Arguments that replace the corresponding specifiers in the formatString.
	 */
	formatArgs?: string[]

	/**
	 * The time the event was created.
	 */
	time: string
}

/**
 * A format function used to normalize the raw event data so that the CLI can log consistently.
 * Implementations are expected to return printf-like strings and args as well as event time.
 *
 * @param eventData Any instance of {@link MessageEvent.data}
 */
export type EventFormatter = (eventData: LiveLogMessage) => EventFormat

export const parseEvent = (event: MessageEvent): LiveLogMessage => {
	try {
		const message = JSON.parse(event.data)
		if (isLiveLogMessage(message)) {
			return message
		} else {
			throw Error('Unexpected log message type.')
		}
	} catch (error) {
		throw Error(`Unable to parse received event ${event.data}.`, { cause: error })
	}
}

/**
 * Log received Server-sent event data to the console.
 *
 * Aside from the event time which is logged first for all messages, format is specified by the
 * caller with a function that returns printf-like strings and args via {@link EventFormat}.
 *
 * @param message a message received by a target object
 * @param formatter a format function that controls how data is displayed
 */
export const logEvent = (message: LiveLogMessage, formatter: EventFormatter): void => {
	const eventFormat = formatter(message)
	const outputString = formatTimePrefix.concat(eventFormat.formatString)
	const outputArgs = eventFormat.formatArgs
		? [eventFormat.time].concat(eventFormat.formatArgs)
		: [eventFormat.time]

	console.log(outputString, ...outputArgs)
}
