import { outputItemOrList, selectFromList } from '@smartthings/cli-lib'
import CapabilityTranslationsCommand from '../../../commands/capabilities/translations'
import { LocaleReference, CapabilitiesEndpoint } from '@smartthings/core-sdk'


describe('CapabilityTranslationsCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)
	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue({ id: 'switch', version: 1 })
	const locales = [{ tag: 'en' }, { tag: 'ko' }] as LocaleReference[]
	const listSpy = jest.spyOn(CapabilitiesEndpoint.prototype, 'listLocales').mockResolvedValue(locales)
	const tag = { tag: 'en' }
	const getSpy = jest.spyOn(CapabilitiesEndpoint.prototype, 'getTranslations').mockResolvedValue(tag)

	test('list without version', async() => {
		outputItemOrListMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})

		await expect(CapabilityTranslationsCommand.run(['switch'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(CapabilityTranslationsCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['tag'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
			true,
		)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith('switch', 1)
	})

	test('list with version', async() => {
		outputItemOrListMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})
		selectFromListMock.mockResolvedValueOnce({ id: 'switch', version: 2 })

		await expect(CapabilityTranslationsCommand.run(['switch', '2'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(CapabilityTranslationsCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['tag'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
			true,
		)
		expect(selectFromList).toHaveBeenCalledWith(
			expect.any(CapabilityTranslationsCommand),
			expect.any(Object),
			expect.objectContaining({
				preselectedId: { id: 'switch', version: '2' },
			}),
		)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith('switch', 2)
	})

	test('get with version', async() => {
		outputItemOrListMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction, getFunction) => {
			await getFunction('en')
		})

		await expect(CapabilityTranslationsCommand.run(['switch', '1', 'en'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(CapabilityTranslationsCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['tag'],
			}),
			'en',
			expect.any(Function),
			expect.any(Function),
			true,
		)

		expect(getSpy).toHaveBeenCalledTimes(1)
		expect(getSpy).toHaveBeenCalledWith('switch', 1, 'en')
	})

	test('get without version', async() => {
		outputItemOrListMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction, getFunction) => {
			await getFunction('ko')
		})

		await expect(CapabilityTranslationsCommand.run(['switch', 'ko'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(CapabilityTranslationsCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['tag'],
			}),
			'ko',
			expect.any(Function),
			expect.any(Function),
			true,
		)

		expect(getSpy).toHaveBeenCalledTimes(1)
		expect(getSpy).toHaveBeenCalledWith('switch', 1, 'ko')
	})
})
