import { CliUx } from '@oclif/core'

/**
 * This controls how every Server-sent event is formatted to the console in the CLI.
 */
const FORMAT_TIME_PREFIX = '%s '

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
export type EventFormatter = (eventData: unknown) => EventFormat

function parseEvent(event: MessageEvent): unknown {
	try {
		return JSON.parse(event.data)
	} catch (error) {
		CliUx.ux.warn(`Unable to parse received event. ${error.message ?? error}`)
	}
}

/**
 * Log received Server-sent event data to the console.
 *
 * Aside from the event time which is logged first for all messages, format is specified by the
 * caller with a function that returns printf-like strings and args via {@link EventFormat}.
 *
 * @param event a message received by a target object
 * @param formatter a format function that controls how data is displayed
 */
export function logEvent(event: MessageEvent, formatter: EventFormatter): void {
	const sse = parseEvent(event)
	if (sse === undefined) {
		return
	}

	const eventFormat = formatter(sse)
	const outputString = FORMAT_TIME_PREFIX.concat(eventFormat.formatString)
	const outputArgs = eventFormat.formatArgs ? [eventFormat.time].concat(eventFormat.formatArgs) : [eventFormat.time]

	CliUx.ux.log(outputString, ...outputArgs)
}
