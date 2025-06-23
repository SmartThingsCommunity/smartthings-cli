import { jest } from '@jest/globals'

import type { createWriteStream, WriteStream } from 'node:fs'
import type { readFile } from 'node:fs/promises'

import type JSZip from 'jszip'
import type { Matcher } from 'picomatch'
import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	ChannelsEndpoint,
	DriversEndpoint,
	EdgeDriver,
	HubdevicesEndpoint,
} from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/drivers/package.js'
import type { CLIConfig } from '../../../../lib/cli-config.js'
import type { fatalError } from '../../../../lib/util.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { outputItem, outputItemBuilder } from '../../../../lib/command/output-item.js'
import type { SmartThingsCommandFlags } from '../../../../lib/command/smartthings-command.js'
import type {
	buildTestFileMatchers,
	processConfigFile,
	processFingerprintsFile,
	processProfiles,
	processSearchParametersFile,
	processSrcDir,
	resolveProjectDirName,
} from '../../../../lib/command/util/edge-driver-package.js'
import type { chooseHub } from '../../../../lib/command/util/hubs-choose.js'
import type { chooseChannel } from '../../../../lib/command/util/edge/channels-choose.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'


const fatalErrorMock = jest.fn<typeof fatalError>()
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const createWriteStreamMock = jest.fn<typeof createWriteStream>()
jest.unstable_mockModule('node:fs', () => ({
	createWriteStream: createWriteStreamMock,
}))

const readFileMock = jest.fn<typeof readFile>().mockResolvedValue('zip file contents')
jest.unstable_mockModule('node:fs/promises', () => ({
	readFile: readFileMock,
}))

const zipContents = {} as Uint8Array
const pipeMock = jest.fn<NodeJS.ReadableStream['pipe']>()
const readableStream = {
	pipe: pipeMock,
} as unknown as NodeJS.ReadableStream
const generateAsyncMock = jest.fn<JSZip['generateAsync']>().mockResolvedValue(zipContents)
const generateNodeStreamMock = jest.fn<JSZip['generateNodeStream']>().mockReturnValue(readableStream)
const zipMock = {
	generateAsync: generateAsyncMock,
	generateNodeStream: generateNodeStreamMock,
} as unknown as JSZip
// eslint-disable-next-line @typescript-eslint/naming-convention
const JSZipMock = jest.fn<typeof JSZip>().mockReturnValue(zipMock)
jest.unstable_mockModule('jszip', () => ({
	default: JSZipMock,
}))

const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../../..')

const outputItemMock = jest.fn<typeof outputItem>()
const outputItemBuilderMock = jest.fn<typeof outputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
	outputItemBuilder: outputItemBuilderMock,
}))

const testFileMatcherMock = jest.fn<Matcher>()
const buildTestFileMatchersMock = jest.fn<typeof buildTestFileMatchers>()
	.mockReturnValue([testFileMatcherMock as unknown as Matcher])
const processConfigFileMock = jest.fn<typeof processConfigFile>()
const processFingerprintsFileMock = jest.fn<typeof processFingerprintsFile>()
const processProfilesMock = jest.fn<typeof processProfiles>()
const processSearchParametersFileMock = jest.fn<typeof processSearchParametersFile>()
const processSrcDirMock = jest.fn<typeof processSrcDir>().mockResolvedValue(true)
const resolveProjectDirNameMock = jest.fn<typeof resolveProjectDirName>().mockResolvedValue('project dir')
jest.unstable_mockModule('../../../../lib/command/util/edge-driver-package.js', () => ({
	buildTestFileMatchers: buildTestFileMatchersMock,
	processConfigFile: processConfigFileMock,
	processFingerprintsFile: processFingerprintsFileMock,
	processProfiles: processProfilesMock,
	processSearchParametersFile: processSearchParametersFileMock,
	processSrcDir: processSrcDirMock,
	resolveProjectDirName: resolveProjectDirNameMock,
}))

const chooseHubMock = jest.fn<typeof chooseHub>().mockResolvedValue('chosen-hub-id')
jest.unstable_mockModule('../../../../lib/command/util/hubs-choose.js', () => ({
	chooseHub: chooseHubMock,
}))

const chooseChannelMock = jest.fn<typeof chooseChannel>().mockResolvedValue('chosen-channel-id')
jest.unstable_mockModule('../../../../lib/command/util/edge/channels-choose.js', () => ({
	chooseChannel: chooseChannelMock,
}))

// fake exiting with a special thrown error
const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw Error('exit called') })

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../../commands/edge/drivers/package.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(6)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiChannelsAssignDriverMock = jest.fn<typeof ChannelsEndpoint.prototype.assignDriver>()
	const apiDriversUploadMock = jest.fn<typeof DriversEndpoint.prototype.upload>()
	const apiHubDevicesInstallDriverMock = jest.fn<typeof HubdevicesEndpoint.prototype.installDriver>()
	const stringArrayConfigValueMock = jest.fn<CLIConfig['stringArrayConfigValue']>().mockReturnValue(['test dir'])
	const command = {
		client: {
			channels: {
				assignDriver: apiChannelsAssignDriverMock,
			},
			drivers: {
				upload: apiDriversUploadMock,
			},
			hubdevices: {
				installDriver: apiHubDevicesInstallDriverMock,
			},
		},
		cliConfig: {
			stringArrayConfigValue: stringArrayConfigValueMock,
		},
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const driver = { driverId: 'driver-id', version: 'driver version' } as EdgeDriver
	apiDriversUploadMock.mockResolvedValue(driver)
	outputItemMock.mockResolvedValue(driver)

	it('uploads previously generated zip file', async () => {
		const inputArgv = { profile: 'default', upload: 'driver.zip' } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(readFileMock).toHaveBeenCalledExactlyOnceWith('driver.zip')
		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['driverId', 'name']) }),
			expect.any(Function),
		)

		expect(resolveProjectDirNameMock).not.toHaveBeenCalled()
		expect(chooseChannelMock).not.toHaveBeenCalled()

		const getData = outputItemMock.mock.calls[0][2]

		expect(await getData()).toBe(driver)

		expect(apiDriversUploadMock).toHaveBeenCalledExactlyOnceWith('zip file contents')
	})

	const baseInputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('informs user when upload file not found', async () => {
		const inputArgv = { ...baseInputArgv, upload: 'missing.zip' } as ArgumentsCamelCase<CommandArgs>
		readFileMock.mockImplementationOnce(() => { throw { code: 'ENOENT' } })

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(readFileMock).toHaveBeenCalledExactlyOnceWith('missing.zip')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('No file named "missing.zip" found.')
		expect(outputItemMock).not.toHaveBeenCalled()
	})

	it('rethrows other read errors', async () => {
		const inputArgv = { ...baseInputArgv, upload: 'driver.zip' } as ArgumentsCamelCase<CommandArgs>
		readFileMock.mockImplementationOnce(() => { throw Error('badness happened') })

		await expect(cmd.handler(inputArgv)).rejects.toThrow('badness happened')

		expect(readFileMock).toHaveBeenCalledExactlyOnceWith('driver.zip')
		expect(fatalErrorMock).not.toHaveBeenCalled()
		expect(outputItemMock).not.toHaveBeenCalled()
	})

	it('generates zip file with --build-only', async () => {
		const inputArgv = {
			profile: 'default',
			buildOnly: 'driver.zip',
			projectDirectory: 'driver-dir',
		} as ArgumentsCamelCase<CommandArgs>
		const writeStreamOnMock = jest.fn()
		const writeStreamMock: WriteStream = {
			on: writeStreamOnMock,
		} as unknown as WriteStream
		createWriteStreamMock.mockReturnValueOnce(writeStreamMock)
		pipeMock.mockReturnValueOnce(writeStreamMock)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(resolveProjectDirNameMock).toHaveBeenCalledExactlyOnceWith('driver-dir')
		expect(JSZipMock).toHaveBeenCalledExactlyOnceWith()
		expect(processConfigFileMock).toHaveBeenCalledExactlyOnceWith('project dir', zipMock)
		expect(processFingerprintsFileMock).toHaveBeenCalledExactlyOnceWith('project dir', zipMock)
		expect(processSearchParametersFileMock).toHaveBeenCalledExactlyOnceWith('project dir', zipMock)
		expect(stringArrayConfigValueMock).toHaveBeenCalledExactlyOnceWith('edgeDriverTestDirs', expect.any(Array))
		expect(buildTestFileMatchersMock).toHaveBeenCalledExactlyOnceWith(['test dir'])
		expect(processSrcDirMock).toHaveBeenCalledExactlyOnceWith('project dir', zipMock, [testFileMatcherMock])
		expect(processProfilesMock).toHaveBeenCalledExactlyOnceWith('project dir', zipMock)
		expect(generateNodeStreamMock).toHaveBeenCalledExactlyOnceWith(
			{ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE' },
		)
		expect(createWriteStreamMock).toHaveBeenCalledExactlyOnceWith('driver.zip')
		expect(pipeMock).toHaveBeenCalledExactlyOnceWith(writeStreamMock)
		expect(writeStreamOnMock).toHaveBeenCalledExactlyOnceWith('finish', expect.any(Function))

		expect(outputItemMock).not.toHaveBeenCalled()
		expect(exitSpy).not.toHaveBeenCalled()

		const onFinish = writeStreamOnMock.mock.calls[0][1] as () => void

		onFinish()

		expect(consoleLogSpy).toHaveBeenCalledWith('wrote driver.zip')
	})

	it('creates and uploads zip file', async () => {
		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(generateAsyncMock).toHaveBeenCalledExactlyOnceWith({ type: 'uint8array', compression: 'DEFLATE' })
		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['driverId', 'name']) }),
			expect.any(Function),
		)

		expect(generateNodeStreamMock).not.toHaveBeenCalled()

		const getData = outputItemMock.mock.calls[0][2]

		expect(await getData()).toBe(driver)

		expect(apiDriversUploadMock).toHaveBeenCalledExactlyOnceWith(zipContents)
	})

	it('exits when processing source directory fails', async () => {
		processSrcDirMock.mockResolvedValueOnce(false)

		await expect(cmd.handler(baseInputArgv)).rejects.toThrow('exit called')
	})

	it('assigns when --assign specified', async () => {
		await expect(cmd.handler({ ...baseInputArgv, assign: true })).resolves.not.toThrow()

		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['driverId', 'name']) }),
			expect.any(Function),
		)

		expect(chooseChannelMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(apiChannelsAssignDriverMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-channel-id', 'driver-id', 'driver version')
		expect(consoleLogSpy)
			.toHaveBeenCalledWith('Assigned driver driver-id (version driver version) to channel chosen-channel-id.')

		expect(apiHubDevicesInstallDriverMock).not.toHaveBeenCalled()
	})

	it('assigns when --channel specified', async () => {
		await expect(cmd.handler({ ...baseInputArgv, channel: 'cmd-line-channel' })).resolves.not.toThrow()

		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['driverId', 'name']) }),
			expect.any(Function),
		)

		expect(chooseChannelMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-channel',
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(apiChannelsAssignDriverMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-channel-id', 'driver-id', 'driver version')

		expect(apiHubDevicesInstallDriverMock).not.toHaveBeenCalled()
	})

	it('installs when --install specified', async () => {
		await expect(cmd.handler({ ...baseInputArgv, install: true })).resolves.not.toThrow()

		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['driverId', 'name']) }),
			expect.any(Function),
		)

		expect(chooseChannelMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(apiChannelsAssignDriverMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-channel-id', 'driver-id', 'driver version')
		expect(apiHubDevicesInstallDriverMock).toHaveBeenCalledExactlyOnceWith(
			'driver-id',
			'chosen-hub-id',
			'chosen-channel-id',
		)
		expect(consoleLogSpy)
			.toHaveBeenCalledWith('Installed driver driver-id (version driver version) to hub chosen-hub-id.')
	})

	it('installs when hub specified', async () => {
		await expect(cmd.handler({ ...baseInputArgv, hub: 'cmd-line-hub' })).resolves.not.toThrow()

		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['driverId', 'name']) }),
			expect.any(Function),
		)

		expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-hub',
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(apiChannelsAssignDriverMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-channel-id', 'driver-id', 'driver version')
		expect(apiHubDevicesInstallDriverMock).toHaveBeenCalledExactlyOnceWith(
			'driver-id',
			'chosen-hub-id',
			'chosen-channel-id',
		)
		expect(consoleLogSpy)
			.toHaveBeenCalledWith('Installed driver driver-id (version driver version) to hub chosen-hub-id.')
	})
})
