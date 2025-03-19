import type { HistoryFlags } from '../../../../lib/command/util/history-builder.js'
import { buildArgvMock } from '../../../test-lib/builder-mock.js'


const { historyBuilder } = await import('../../../../lib/command/util/history-builder.js')


test('historyBuilder', async () => {
	const {
		optionMock,
		argvMock,
	} = buildArgvMock<object, HistoryFlags>()

	expect(historyBuilder(argvMock)).toBe(argvMock)

	expect(optionMock).toHaveBeenCalledTimes(4)
})
