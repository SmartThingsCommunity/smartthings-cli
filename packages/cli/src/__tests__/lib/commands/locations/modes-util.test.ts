import { Config } from '@oclif/core'

import { Location, LocationsEndpoint, NoOpAuthenticator, Mode, ModesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, selectFromList } from '@smartthings/cli-lib'
import * as locationsModule from '../../../../commands/locations'

import { getModesByLocation, chooseMode } from '../../../../lib/commands/locations/modes-util'
import * as modesUtil from '../../../../lib/commands/locations/modes-util'


describe('modes-util', () => {
	const locationId = 'locationId'
	const locationName = 'test location'
	const modeId = 'id'
	const modeName = 'name'

	describe('getModesByLocation', () => {
		const testClient = new SmartThingsClient(new NoOpAuthenticator)
		const listModesSpy = jest.spyOn(ModesEndpoint.prototype, 'list').mockImplementation()
		const getLocationsSpy = jest.spyOn(LocationsEndpoint.prototype, 'get').mockImplementation()
		const listLocationsSpy = jest.spyOn(LocationsEndpoint.prototype, 'list').mockImplementation()

		it('throws error when no locations are found', async () => {
			listLocationsSpy.mockResolvedValueOnce([])
			const forbiddenError = new Error('Request failed with status code 403')
			getLocationsSpy.mockRejectedValueOnce(forbiddenError)

			await expect(getModesByLocation(testClient)).rejects.toThrow('could not find any locations')
			await expect(getModesByLocation(testClient, locationId)).rejects.toThrow(forbiddenError)
		})

		it('returns modes with location ID and name added', async () => {
			const location: Location = {
				locationId,
				name: locationName,
				timeZoneId: '',
				backgroundImage: '',
				countryCode: '',
				temperatureScale: 'C',
			}
			const modes: Mode[] = [
				{
					name: modeName,
					id: modeId,
					label: 'modeLabel',
				},
			]

			getLocationsSpy.mockResolvedValueOnce(location)
			listModesSpy.mockResolvedValueOnce(modes)

			const modesWithLocations = await getModesByLocation(testClient, locationId)

			expect(modesWithLocations[0]).toEqual(expect.objectContaining(modes[0]))
			expect(modesWithLocations[0].locationId).toBe(locationId)
			expect(modesWithLocations[0].location).toBe(locationName)
		})
	})

	describe('chooseMode', () => {
		const getModesByLocationSpy = jest.spyOn(modesUtil, 'getModesByLocation')
		const chooseLocationSpy = jest.spyOn(locationsModule, 'chooseLocation')
		class MockCommand extends APICommand<typeof MockCommand.flags> {
			async run(): Promise<void> {
				// eslint-disable-line @typescript-eslint/no-empty-function
			}
		}
		const command = new MockCommand([], new Config({ root: '' }))
		const mockSelectFromList = jest.mocked(selectFromList)

		beforeAll(() => {
			getModesByLocationSpy.mockResolvedValue([])
			mockSelectFromList.mockResolvedValue(modeId)
		})

		it('throws error when mode not found', async () => {
			await expect(modesUtil.chooseMode(command)).rejects.toThrow('could not find mode')

			const modesWithLocation = [{
				id: 'notFound',
				locationId: locationId,
				name: 'test',
			}]
			getModesByLocationSpy.mockResolvedValueOnce(modesWithLocation)

			await expect(chooseMode(command)).rejects.toThrow('could not find mode')
		})

		it('throws error when locationId is missing', async () => {
			const modesWithLocation = [{
				id: modeId,
				name: 'test',
			}]
			getModesByLocationSpy.mockResolvedValueOnce(modesWithLocation)

			await expect(chooseMode(command)).rejects.toThrow('could not determine location id for mode')
		})

		it('returns mode tuple when mode is found', async () => {
			const modesWithLocation = [{
				id: modeId,
				locationId: locationId,
				name: 'test',
			},
			{
				id: 'mode2',
				locationId: locationId,
				name: 'mode2',
			}]

			getModesByLocationSpy.mockResolvedValueOnce(modesWithLocation)

			await expect(chooseMode(command, locationId)).resolves.toEqual([modeId, locationId])
		})

		it('calls selectFromList with correct config', async () => {
			await expect(chooseMode(command, undefined, modeId)).rejects.toThrow('could not find mode')

			expect(mockSelectFromList).toBeCalledWith(
				expect.anything(),
				expect.objectContaining({
					itemName: 'mode',
					primaryKeyName: 'id',
					sortKeyName: 'label',
					listTableFieldDefinitions: expect.anything(),
				}),
				expect.objectContaining({ preselectedId: modeId }),
			)
		})

		it('passes on locationId when retrieving modes', async () => {
			chooseLocationSpy.mockResolvedValueOnce('chosenLocation')
			await expect(chooseMode(command)).rejects.toThrow('could not find mode')

			expect(chooseLocationSpy).toBeCalledWith(command, undefined, true)
			expect(getModesByLocationSpy).toBeCalledWith(expect.any(SmartThingsClient), 'chosenLocation')

			getModesByLocationSpy.mockClear
			chooseLocationSpy.mockResolvedValueOnce(locationId)

			await expect(chooseMode(command, locationId)).rejects.toThrow('could not find mode')

			expect(chooseLocationSpy).toBeCalledWith(command, locationId, true)
			expect(getModesByLocationSpy).toBeCalledWith(expect.any(SmartThingsClient), locationId)
		})
	})
})
