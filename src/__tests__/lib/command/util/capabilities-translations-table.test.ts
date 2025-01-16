import type { CapabilityLocalization } from '@smartthings/core-sdk'

import { mockedTableOutput, newOutputTableMock, tableGeneratorMock, tablePushMock } from '../../../test-lib/table-mock.js'


const { buildTableOutput } = await import('../../../../lib/command/util/capabilities-translations-table.js')

describe('buildTableGenerator', () => {
	it('includes tag name', () => {
		expect(buildTableOutput(tableGeneratorMock, { tag: 'es_US' })).toBe('Tag: es_US')

		expect(newOutputTableMock).not.toHaveBeenCalled()
	})

	it('includes attributes', () => {
		const data: CapabilityLocalization = { tag: 'es_US', attributes: {
			key1: { label: 'label1', i18n: {} },
			key2: { label: 'label2', description: 'description 2', displayTemplate: 'display template 2' },
			key3: { description: 'description 3' },
		} }

		expect(buildTableOutput(tableGeneratorMock, data)).toBe(`Tag: es_US\n\nAttributes:\n${mockedTableOutput}`)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith({ head: expect.arrayContaining(['Name']) })
		expect(tablePushMock).toHaveBeenCalledTimes(3)
		expect(tablePushMock).toHaveBeenCalledWith(['key1', 'label1', undefined, undefined])
		expect(tablePushMock).toHaveBeenCalledWith(['key2', 'label2', 'description 2', 'display template 2'])
		expect(tablePushMock).toHaveBeenCalledWith(['key3', undefined, 'description 3', undefined])
	})

	it('includes attribute entries', () => {
		const data: CapabilityLocalization = { tag: 'es_US', attributes: {
			key1: {
				label: 'label1',
				i18n: { value: {
					entry1: { label: 'entry1 label' },
					entry2: { label: 'entry2 label', description: 'entry2 description' },
				} },
			},
		} }

		expect(buildTableOutput(tableGeneratorMock, data)).toBe(`Tag: es_US\n\nAttributes:\n${mockedTableOutput}`)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith({ head: expect.arrayContaining(['Name']) })
		expect(tablePushMock).toHaveBeenCalledTimes(3)
		expect(tablePushMock).toHaveBeenCalledWith(['key1', 'label1', undefined, undefined])
		expect(tablePushMock).toHaveBeenCalledWith(['key1.entry1', 'entry1 label', undefined, ''])
		expect(tablePushMock).toHaveBeenCalledWith(['key1.entry2', 'entry2 label', 'entry2 description', ''])
	})

	it('includes commands', () => {
		const data: CapabilityLocalization = { tag: 'es_US', commands: {
			key1: { label: 'label1' },
			key2: { label: 'label2', description: 'description 2' },
			key3: { description: 'description 3' },
		} }

		expect(buildTableOutput(tableGeneratorMock, data)).toBe(`Tag: es_US\n\nCommands:\n${mockedTableOutput}`)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith({ head: expect.arrayContaining(['Name']) })
		expect(tablePushMock).toHaveBeenCalledTimes(3)
		expect(tablePushMock).toHaveBeenCalledWith(['key1', 'label1', undefined])
		expect(tablePushMock).toHaveBeenCalledWith(['key2', 'label2', 'description 2'])
		expect(tablePushMock).toHaveBeenCalledWith(['key3', undefined, 'description 3'])
	})

	it('includes command arguments', () => {
		const data: CapabilityLocalization = { tag: 'es_US', commands: {
			key1: { label: 'label1', arguments: {
				arg1: { label: 'label1', description: 'description 1' },
				arg2: { label: 'label2' },
				arg3: { description: 'description 3' },
			} },
		} }

		expect(buildTableOutput(tableGeneratorMock, data)).toBe(`Tag: es_US\n\nCommands:\n${mockedTableOutput}`)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith({ head: expect.arrayContaining(['Name']) })
		expect(tablePushMock).toHaveBeenCalledTimes(4)
		expect(tablePushMock).toHaveBeenCalledWith(['key1', 'label1', undefined])
		expect(tablePushMock).toHaveBeenCalledWith(['key1.arg1', 'label1', 'description 1'])
		expect(tablePushMock).toHaveBeenCalledWith(['key1.arg2', 'label2', undefined])
		expect(tablePushMock).toHaveBeenCalledWith(['key1.arg3', undefined, 'description 3'])
	})
})
