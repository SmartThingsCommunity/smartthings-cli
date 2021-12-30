import { CliUx } from '@oclif/core'


const formatTimePrefix = '%s '

export interface EventFormat {
	formatString: string
	formatArgs?: string[]
	time: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventFormatter = (event: any) => EventFormat

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvent(event: MessageEvent): any {
	try {
		return JSON.parse(event.data)
	} catch (error) {
		CliUx.ux.warn(`Unable to parse received event. ${error.message ?? error}`)
	}
}

export function logEvent(event: MessageEvent, formatter: EventFormatter): void {
	const sse = parseEvent(event)
	if (sse === undefined) {
		return
	}

	const eventFormat = formatter(sse)
	const outputString = formatTimePrefix.concat(eventFormat.formatString)
	const outputArgs = eventFormat.formatArgs ? [eventFormat.time].concat(eventFormat.formatArgs) : [eventFormat.time]

	CliUx.ux.log(outputString, ...outputArgs)
}
