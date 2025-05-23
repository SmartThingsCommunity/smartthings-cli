import { jest } from '@jest/globals'

import { promises as fs } from 'node:fs'
import type { PeerCertificate } from 'node:tls'

import type inquirer from 'inquirer'
import type { Question } from 'inquirer'

import type { DriverInfo } from '../../../../lib/live-logging.js'
import type { askForBoolean } from '../../../../lib/user-query.js'
import type { fatalError } from '../../../../lib/util.js'
import { convertToId, stringTranslateToId } from '../../../../lib/command/command-util.js'
import type { selectFromList } from '../../../../lib/command/select.js'
import type { SmartThingsCommand } from '../../../../lib/command/smartthings-command.js'


const knownHubsData = '{ "hub1": { "hostname": "hub1", "fingerprint": "hub1-fingerprint" } }'
const readFileMock = jest.fn<typeof fs.readFile>().mockResolvedValue(knownHubsData)
const writeFileMock = jest.fn<typeof fs.writeFile>()
jest.unstable_mockModule('node:fs', () => ({
	promises: {
		readFile: readFileMock,
		writeFile: writeFileMock,
	},
}))

const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
	},
}))

const askForBooleanMock = jest.fn<typeof askForBoolean>()
jest.unstable_mockModule('../../../../lib/user-query.js', () => ({
	askForBoolean: askForBooleanMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const convertToIdMock = jest.fn<typeof convertToId>()
const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId<DriverInfo>>().mockResolvedValue('translated-id')
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	convertToId: convertToIdMock,
	stringTranslateToId: stringTranslateToIdMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList<DriverInfo>>().mockResolvedValue('chosen-id')
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { /*no-op*/ })


const {
	checkServerIdentity,
	chooseHubDrivers,
	getKnownHubs,
} = await import('../../../../lib/command/util/hub-drivers.js')


const command = { dataDir: '/dataDir' } as SmartThingsCommand
describe('chooseHubDrivers', () => {
	/* eslint-disable @typescript-eslint/naming-convention */
	const driver1: DriverInfo = { driver_id: 'driver-id-1', driver_name: 'Driver 1', status: 'some-status' }
	const driver2: DriverInfo = { driver_id: 'driver-id-2', driver_name: 'Driver 2', status: 'other-status' }
	/* eslint-enable @typescript-eslint/naming-convention */
	const hubDriverList = [driver1, driver2]

	it('uses preselected id when given', async () => {
		expect(await chooseHubDrivers(command, hubDriverList, 'preselected-id')).toBe('chosen-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'driver' }),
			'preselected-id',
			expect.any(Function),
		)
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({}),
			{ preselectedId: 'translated-id', listItems: expect.any(Function), getIdFromUser: expect.any(Function) },
		)
	})

	it('prompts user when no preselected-id is given', async () => {
		stringTranslateToIdMock.mockResolvedValueOnce(undefined)

		expect(await chooseHubDrivers(command, hubDriverList, undefined)).toBe('chosen-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({}),
			undefined,
			expect.any(Function),
		)
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({}),
			{ preselectedId: undefined, listItems: expect.any(Function), getIdFromUser: expect.any(Function) },
		)

		const listItems = stringTranslateToIdMock.mock.calls[0][2]
		expect(selectFromListMock.mock.calls[0][2].listItems).toBe(listItems)

		expect(await listItems()).toBe(hubDriverList)

		const getIdFromUser = selectFromListMock.mock.calls[0][2].getIdFromUser
		expect(getIdFromUser).toBeDefined()
		promptMock.mockResolvedValueOnce({ itemIdOrIndex: 'prompt-answer' })
		convertToIdMock.mockReturnValueOnce('converted-id')

		expect(await getIdFromUser?.({ primaryKeyName: 'driver_id' }, hubDriverList)).toBe('converted-id')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			type: 'input',
			message: 'Enter id or index',
		}))
		expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('prompt-answer', 'driver_id', hubDriverList)
	})

	it('returns undefined when no specific driver is chosen', async () => {
		selectFromListMock.mockResolvedValueOnce('all')

		expect(await chooseHubDrivers(command, hubDriverList)).toBe(undefined)

		const getIdFromUser = selectFromListMock.mock.calls[0][2].getIdFromUser
		expect(getIdFromUser).toBeDefined()
		promptMock.mockResolvedValueOnce({ itemIdOrIndex: 'all' })

		expect(await getIdFromUser?.({ primaryKeyName: 'driver_id' }, hubDriverList)).toBe('all')

		expect(convertToIdMock).not.toHaveBeenCalled()
	})

	it('accepts valid input from user', async () => {
		expect(await chooseHubDrivers(command, hubDriverList)).toBe('chosen-id')

		const getIdFromUser = selectFromListMock.mock.calls[0][2].getIdFromUser
		promptMock.mockResolvedValueOnce({ itemIdOrIndex: 'valid input' })
		convertToIdMock.mockReturnValueOnce('converted-id')
		expect(await getIdFromUser?.({ primaryKeyName: 'driver_id' }, hubDriverList)).toBe('converted-id')
		convertToIdMock.mockClear()

		convertToIdMock.mockReturnValueOnce('converted-id')
		const validate = (promptMock.mock.calls[0][0] as Question).validate
		expect(validate).toBeDefined()
		expect(validate?.('valid input')).toBe(true)
		expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('valid input', 'driver_id', hubDriverList)
	})

	it('rejects invalid input from user', async () => {
		expect(await chooseHubDrivers(command, hubDriverList)).toBe('chosen-id')

		const getIdFromUser = selectFromListMock.mock.calls[0][2].getIdFromUser
		promptMock.mockResolvedValueOnce({ itemIdOrIndex: 'invalid input' })
		convertToIdMock.mockReturnValueOnce('converted-id')
		expect(await getIdFromUser?.({ primaryKeyName: 'driver_id' }, hubDriverList)).toBe('converted-id')
		convertToIdMock.mockClear()

		convertToIdMock.mockReturnValueOnce(undefined)
		const validate = (promptMock.mock.calls[0][0] as Question).validate
		expect(validate).toBeDefined()
		expect(validate?.('invalid input'))
			.toBe('Invalid id or index "invalid input". Please enter an index or valid id.')
		expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('invalid input', 'driver_id', hubDriverList)
	})

	it('throws error if bad id somehow got past validation', async () => {
		expect(await chooseHubDrivers(command, hubDriverList)).toBe('chosen-id')

		const getIdFromUser = selectFromListMock.mock.calls[0][2].getIdFromUser
		promptMock.mockResolvedValueOnce({ itemIdOrIndex: 'invalid input' })
		convertToIdMock.mockReturnValueOnce(false)
		await expect(getIdFromUser?.({ primaryKeyName: 'driver_id' }, hubDriverList)).rejects.toThrow('invalid state')
	})
})

describe('getKnownHubs', () => {
	it('returns parsed input', async () => {
		expect(await getKnownHubs('/path/to/known-hubs'))
			.toStrictEqual({ hub1: { hostname: 'hub1', fingerprint: 'hub1-fingerprint' } })
	})

	it('returns an empty map when file does not exist', async () => {
		const error = { code: 'ENOENT' }
		readFileMock.mockImplementationOnce(() => { throw error })

		expect(await getKnownHubs('/path/to/known-hubs')).toStrictEqual({})
	})

	it('rethrows other errors', async () => {
		const error = Error('something bad happened')
		readFileMock.mockImplementationOnce(() => { throw error })

		await expect(getKnownHubs('/path/to/known-hubs')).rejects.toThrow(error)
	})
})

describe('checkServerIdentity', () => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const certificate = { valid_from: 'yesterday about 3 a.m.', fingerprint: 'hub1-fingerprint' } as PeerCertificate
	const hub2Certificate = { ...certificate, fingerprint: 'hub2-fingerprint' }

	it('does nothing if hub already known', async ()  => {
		await checkServerIdentity(command, 'hub1', certificate)

		expect(fatalErrorMock).not.toHaveBeenCalled()
	})

	it('prompts user to confirm new host', async () => {
		askForBooleanMock.mockResolvedValueOnce(true)

		await checkServerIdentity(command, 'hub2', hub2Certificate)

		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringMatching(/The authenticity of .* can't be established./))
		expect(askForBooleanMock).toHaveBeenCalledExactlyOnceWith(
			'Are you sure you want to continue connecting?',
			{ default : false },
		)
		expect(writeFileMock).toHaveBeenCalledExactlyOnceWith(
			'/dataDir/known_hubs.json',
			expect.stringMatching(/"hub2".*"hub2-fingerprint"/),
		)
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringMatching(/Permanently added hub2/))

		expect(fatalErrorMock).not.toHaveBeenCalled()
	})

	it('fails if user rejects host', async () => {
		askForBooleanMock.mockResolvedValueOnce(false)

		expect(await checkServerIdentity(command, 'hub2', hub2Certificate)).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Hub verification failed.')

		expect(writeFileMock).not.toHaveBeenCalled()
		expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringMatching(/Permanently added hub2/))
	})
})
