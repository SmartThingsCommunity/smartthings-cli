import { jest } from '@jest/globals'

import type { BorderConfig, getBorderCharacters, table } from 'table'
import type { findTopicsAndSubcommands } from '../../lib/command-util.js'


const borderConfig = { topLeft: 'top-left' } as BorderConfig
const getBorderCharactersMock = jest.fn<typeof getBorderCharacters>()
	.mockReturnValue(borderConfig)
const tableMock = jest.fn<typeof table>()
jest.unstable_mockModule('table', () => ({
	getBorderCharacters: getBorderCharactersMock,
	table: tableMock,
}))

const findTopicsAndSubcommandsMock = jest.fn<typeof findTopicsAndSubcommands>()
	.mockReturnValue({ topics: [], subCommands: [] })
jest.unstable_mockModule('../../lib/command-util.js', () => ({
	findTopicsAndSubcommands: findTopicsAndSubcommandsMock,
}))


const { buildEpilog, apiDocsURL, itemInputHelpText } = await import('../../lib/help.js')


describe('apiDocsURL', () => {
	it('builds URL stanza for single api name', () => {
		const result = apiDocsURL('getDevice')
		expect(result).toBe('For API information, see:\n' +
			'  https://developer.smartthings.com/docs/api/public/#operation/getDevice')
	})

	it('builds URL stanza for multiple api names', () => {
		const result = apiDocsURL(['getDevice', 'listDevices'])
		expect(result).toBe(
			'For API information, see:\n' +
			'  https://developer.smartthings.com/docs/api/public/#operation/getDevice\n' +
			'  https://developer.smartthings.com/docs/api/public/#operation/listDevices',
		)
	})

	it('passes through existing URLs', () => {
		const result = apiDocsURL(['http://example.com/doc', 'https://example.com/ssl-doc', 'getDevice'])
		expect(result).toBe(
			'For API information, see:\n' +
			'  http://example.com/doc\n' +
			'  https://example.com/ssl-doc\n' +
			'  https://developer.smartthings.com/docs/api/public/#operation/getDevice',
		)
	})
})

describe('itemInputHelpText', () => {
	it('builds help text for a single name', () => {
		const result = itemInputHelpText('getDevice')
		expect(result).toBe('More information can be found at:\n' +
			'  https://developer.smartthings.com/docs/api/public/#operation/getDevice')
	})

	it('builds help text for multiple names and URLs', () => {
		const result = itemInputHelpText('getDevice', 'http://example.com/doc')
		expect(result).toBe(
			'More information can be found at:\n' +
			'  https://developer.smartthings.com/docs/api/public/#operation/getDevice\n' +
			'  http://example.com/doc',
		)
	})
})

describe('buildEpilog', () => {
	it('returns empty string when no options provided', () => {
		expect(buildEpilog({ command: 'test' })).toBe('')
	})

	it('includes note from note provided via `notes`', () => {
		const epilog = buildEpilog({ command: 'test', notes: 'Single note' })
		expect(epilog).toBe('Notes:\n  Single note')
	})

	it('includes note from formattedNotes', () => {
		expect(buildEpilog({ command: 'test', formattedNotes: 'formatted note' })).toBe('Notes:\nformatted note')
	})

	it('includes all notes from multiple notes provided via `notes`', () => {
		expect(buildEpilog({ command: 'test', notes: ['First note', 'Second note', 'Third note'] }))
			.toBe('Notes:\n  First note\n  Second note\n  Third note')
	})

	it('includes notes from both notes and formattedNotes', () => {
		expect(buildEpilog({ command: 'test', notes: ['note 1', 'note 2'], formattedNotes: 'formatted notes' }))
			.toBe('Notes:\n  note 1\n  note 2\nformatted notes')
	})

	it('includes topics section when topics found', () => {
		findTopicsAndSubcommandsMock.mockReturnValueOnce({ topics: ['test::topic'], subCommands: [] })
		expect(buildEpilog({ command: 'test' })).toBe('Topics:\n  test::topic')

		findTopicsAndSubcommandsMock.mockReturnValueOnce({ topics: ['topic1', 'topic2'], subCommands: [] })
		expect(buildEpilog({ command: 'test' })).toBe('Topics:\n  topic1\n  topic2')
	})

	it('includes apiDocs section when apiDocs provided', () => {
		expect(buildEpilog({ command: 'devices', apiDocs: ['getDevice', 'listDevices'] }))
			.toBe(
				'For API information, see:\n' +
				'  https://developer.smartthings.com/docs/api/public/#operation/getDevice\n' +
				'  https://developer.smartthings.com/docs/api/public/#operation/listDevices',
			)
	})

	it('includes sub-commands section when sub-commands found', () => {
		tableMock.mockReturnValueOnce('sub-command table output')
		const subCommands = [
			{
				relatedName: 'test:sub1',
				command: {
					describe: 'sub 1 description',
					handler: () => { /* noop */ },
				},
			},
			{
				relatedName: 'test:sub2',
				command: {
					describe: 'sub 2 description',
					handler: () => { /* noop */ },
				},
			},
		]
		findTopicsAndSubcommandsMock.mockReturnValueOnce({ topics: [], subCommands })

		expect(buildEpilog({ command: 'test' })).toBe(('Sub-Commands:\nsub-command table output'))

		expect(getBorderCharactersMock).toHaveBeenCalledExactlyOnceWith('void')
		expect(tableMock).toHaveBeenCalledExactlyOnceWith([
			['  test:sub1', 'sub 1 description' ],
			['  test:sub2', 'sub 2 description' ],
		], expect.objectContaining({ border: borderConfig }))

		// Call this trivial function to fulfill test coverage. :-)
		expect(tableMock.mock.calls[0][1]?.drawHorizontalLine?.(0, 0)).toBe(false)
	})

	it('joins sections correctly when multiple present', () => {
		findTopicsAndSubcommandsMock.mockReturnValueOnce({ topics: ['test::topic'], subCommands: [] })

		expect(buildEpilog({ command: 'test', formattedNotes: 'formatted note' }))
			.toBe('Notes:\nformatted note\n\nTopics:\n  test::topic')
	})
})
