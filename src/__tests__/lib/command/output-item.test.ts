import { jest } from '@jest/globals'

import type { GetDataFunction } from '../../../lib/command/io-defs.js'
import type { formatAndWriteItem, formatAndWriteList } from '../../../lib/command/format.js'
import type { OutputItemFlags } from '../../../lib/command/output-item.js'
import type { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'
import type { SimpleType } from '../../test-lib/simple-type.js'


const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem>()
const formatAndWriteListMock = jest.fn<typeof formatAndWriteList>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteList: formatAndWriteListMock,
}))


const { outputItem } = await import('../../../lib/command/output-item.js')


test('outputItem', async () => {
	const item: SimpleType = { str: 'string-1', num: 5 }

	const command = { flags: { output: 'output.yaml' } } as SmartThingsCommand<OutputItemFlags>
	const config = {
		tableFieldDefinitions: [],
	}

	const getDataMock = jest.fn<GetDataFunction<SimpleType>>().mockResolvedValue(item)

	expect(await outputItem<SimpleType>(command, config, getDataMock)).toBe(item)

	expect(getDataMock).toHaveBeenCalledExactlyOnceWith()
	expect(formatAndWriteItemMock).toHaveBeenCalledTimes(1)
	expect(formatAndWriteItemMock).toHaveBeenLastCalledWith(command, config, item)
})
