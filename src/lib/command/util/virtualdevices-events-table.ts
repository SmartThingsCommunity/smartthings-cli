import { type DeviceEvent } from '@smartthings/core-sdk'

import { type TableGenerator } from '../..//table-generator.js'


export type EventInputOutput = {
	event: DeviceEvent
	stateChange?: boolean
}

export const buildTableOutput = (tableGenerator: TableGenerator, data: EventInputOutput[]): string =>
	tableGenerator.buildTableFromList(data, [
		{ path: 'event.component' },
		{ path: 'event.capability' },
		{ path: 'event.attribute' },
		{ path: 'event.value' },
	])
