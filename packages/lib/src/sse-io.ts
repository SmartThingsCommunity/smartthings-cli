import cli from 'cli-ux'


const formatTimePrefix = '%s '

export interface EventFormat {
	formatString: string
	formatArgs?: string[]
	time: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventFormatter = (event: any) => EventFormat

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvent(event: Event): any {
	try {
		return JSON.parse((event as MessageEvent).data)
	} catch (error) {
		cli.warn(`Unable to parse received event. ${error.message ?? error}`)
	}
}

export function logEvent(event: Event, formatter: EventFormatter): void {
	const sse = parseEvent(event)
	if (sse === undefined) {
		return
	}

	const eventFormat = formatter(sse)
	const outputString = formatTimePrefix.concat(eventFormat.formatString)
	const outputArgs = eventFormat.formatArgs ? [eventFormat.time].concat(eventFormat.formatArgs) : [eventFormat.time]

	cli.log(outputString, ...outputArgs)
}
