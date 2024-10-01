import { jest } from '@jest/globals'

import type { Table, TableGenerator } from '../../lib/table-generator.js'


export const mockedTableOutput = 'table output'
export const tablePushMock = jest.fn<Table['push']>()
export const tableToStringMock = jest.fn<Table['toString']>().mockReturnValue(mockedTableOutput)
export const tableMock: Table = {
	push: tablePushMock,
	toString: tableToStringMock,
}
export const newOutputTableMock = jest.fn<TableGenerator['newOutputTable']>().mockReturnValue(tableMock)
export const tableGeneratorMock = { newOutputTable: newOutputTableMock } as unknown as TableGenerator
