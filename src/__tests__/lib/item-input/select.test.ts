import { jest } from '@jest/globals'

import inquirer from 'inquirer'

import type { clipToMaximum, stringFromUnknown } from '../../../lib/util.js'
import {
	cancelOption,
	helpAction,
	helpOption,
	maxItemValueLength,
} from '../../../lib/item-input/defs.js'
import type { SelectDefOptions } from '../../../lib/item-input/select.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
		Separator: inquirer.Separator,
	},
}))

const clipToMaximumMock = jest.fn<typeof clipToMaximum>().mockReturnValue('clipped')
const stringFromUnknownMock = jest.fn<typeof stringFromUnknown>().mockReturnValue('string-from-unknown')
jest.unstable_mockModule('../../../lib/util.js', () => ({
	clipToMaximum: clipToMaximumMock,
	stringFromUnknown: stringFromUnknownMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { selectDef } = await import('../../../lib/item-input/select.js')


describe('selectDef', () => {
	const complexItem1 = { name: 'First', value: 'primero' }
	const complexItem2 = { name: 'Second', value: 'segundo' }

	it('uses the given name', () => {
		const def = selectDef('Select Def Name', [])
		expect(def.name).toBe('Select Def Name')
	})

	describe('buildFromUserInput', () => {
		it('handles string values for choices', async () => {
			promptMock.mockResolvedValueOnce({ selection: 'item 2' })

			const def = selectDef('Selected Thing', ['item 1', 'item 2', 'item 3'])
			expect(await def.buildFromUserInput()).toBe('item 2')

			expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				type: 'list',
				message: 'Select Selected Thing.',
				choices: [
					{ name: 'item 1', value: 'item 1' },
					{ name: 'item 2', value: 'item 2' },
					{ name: 'item 3', value: 'item 3' },
					expect.any(inquirer.Separator),
					cancelOption,
				],
				default: 0,
			}))
		})

		it('handles number values for choices', async () => {
			promptMock.mockResolvedValueOnce({ selection: 300 })

			const def = selectDef('Selected Thing', [100, 200, 300])
			expect(await def.buildFromUserInput()).toBe(300)

			expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				type: 'list',
				message: 'Select Selected Thing.',
				choices: [
					{ name: '100', value: 100 },
					{ name: '200', value: 200 },
					{ name: '300', value: 300 },
					expect.any(inquirer.Separator),
					cancelOption,
				],
				default: 0,
			}))
		})

		it('handles complex values for choices', async () => {
			promptMock.mockResolvedValueOnce({ selection: 'segundo' })

			const def = selectDef('Selected Thing', [complexItem1, complexItem2])
			expect(await def.buildFromUserInput()).toBe('segundo')

			expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				type: 'list',
				message: 'Select Selected Thing.',
				choices: [
					{ name: 'First', value: 'primero' },
					{ name: 'Second', value: 'segundo' },
					expect.any(inquirer.Separator),
					cancelOption,
				],
				default: 0,
			}))
		})

		it('uses specified default', async () => {
			promptMock.mockResolvedValueOnce({ selection: 'primero' })

			const def = selectDef(
				'Selected Thing',
				[complexItem1, complexItem2],
				{ default: 'segundo' },
			)
			expect(await def.buildFromUserInput()).toBe('primero')

			expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				default: 'segundo',
			}))
		})

		it('displays help text when available and requested', async () => {
			promptMock.mockResolvedValueOnce({ selection: helpAction })
			promptMock.mockResolvedValueOnce({ selection: 'primero' })

			const def = selectDef(
				'Selected Thing',
				[complexItem1, complexItem2],
				{ helpText: 'help text' },
			)
			expect(await def.buildFromUserInput()).toBe('primero')

			expect(promptMock).toHaveBeenCalledTimes(2)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([helpOption]),
			}))
			expect(consoleLogSpy).toHaveBeenCalledWith('\nhelp text\n')
		})
	})

	describe('summarizeForEdit', () => {
		it('uses name of complex value and clips it', async () => {
			promptMock.mockResolvedValueOnce({ selection: 'primero' })

			const def = selectDef('Selected Thing', [complexItem1, complexItem2])
			await def.buildFromUserInput()

			expect(def.summarizeForEdit('primero')).toBe('clipped')

			expect(clipToMaximumMock).toHaveBeenCalledExactlyOnceWith('First', maxItemValueLength)

			expect(stringFromUnknownMock).not.toHaveBeenCalled()
		})

		it('stringifies value when name not found', () => {
			const def = selectDef('Selected Thing', [1, 3, 7])

			expect(def.summarizeForEdit(5)).toBe('clipped')

			expect(stringFromUnknownMock).toHaveBeenCalledExactlyOnceWith(5)
			expect(clipToMaximumMock)
				.toHaveBeenCalledExactlyOnceWith('string-from-unknown', maxItemValueLength)
		})

		it('uses custom summarizeForEdit when provided', () => {
			const summarizeForEditMock = jest.fn<Required<SelectDefOptions<number>>['summarizeForEdit']>()
				.mockReturnValueOnce('summarized value')
			const def = selectDef('Selected Thing', [1, 3, 7], { summarizeForEdit: summarizeForEditMock })

			expect(def.summarizeForEdit(8)).toBe('summarized value')

			expect(summarizeForEditMock).toHaveBeenCalledExactlyOnceWith(8)

			expect(stringFromUnknownMock).not.toHaveBeenCalled()
			expect(clipToMaximumMock).not.toHaveBeenCalled()
		})
	})

	describe('updateFromUserInput', () => {
		// Shares code from buildFromUserInput so much of this is tested there.

		it('uses original for default', async () => {
			promptMock.mockResolvedValueOnce({ selection: 'primero' })

			const def = selectDef(
				'Selected Thing',
				[complexItem1, complexItem2],
				{ helpText: 'help text' },
			)
			expect(await def.updateFromUserInput('segundo')).toBe('primero')

			expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				default: 'segundo',
			}))
		})
	})
})
