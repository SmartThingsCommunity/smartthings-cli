import { buildTableOutput, type EventInputOutput } from '../../../../lib/command/util/virtualdevices-events-table.js'
import {
	buildTableFromListMock,
	mockedListTableOutput,
	tableGeneratorMock,
} from '../../../test-lib/table-mock.js'


test('buildTableOutput', () => {
	const events = [{ event: { value: 5 } } as EventInputOutput]

	expect(buildTableOutput(tableGeneratorMock, events)).toBe(mockedListTableOutput)

	expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
		events,
		expect.arrayContaining([{ path: 'event.component' }]),
	)
})
