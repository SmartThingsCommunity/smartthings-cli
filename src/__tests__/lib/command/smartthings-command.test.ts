import { jest } from '@jest/globals'

import log4js from 'log4js'

import { CLIConfig, loadConfig } from '../../../lib/cli-config.js'
import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../../../lib/log-utils.js'
import { defaultTableGenerator } from '../../../lib/table-generator.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'
import { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'


const { configureMock, getLoggerMock, loggerMock } = await import('../../test-lib/logger-mock.js')

const loadConfigMock = jest.fn<typeof loadConfig>()
jest.unstable_mockModule('../../../lib/cli-config.js', () => ({
	loadConfig: loadConfigMock,
}))

const buildDefaultLog4jsConfigMock = jest.fn<typeof buildDefaultLog4jsConfig>()
const loadLog4jsConfigMock = jest.fn<typeof loadLog4jsConfig>()
jest.unstable_mockModule('../../../lib/log-utils.js', () => ({
	buildDefaultLog4jsConfig: buildDefaultLog4jsConfigMock,
	loadLog4jsConfig: loadLog4jsConfigMock,
}))

const defaultTableGeneratorMock = jest.fn<typeof defaultTableGenerator>()
jest.unstable_mockModule('../../../lib//table-generator', () => ({
	defaultTableGenerator: defaultTableGeneratorMock,
}))


const { smartThingsCommandBuilder, smartThingsCommand } = await import('../../../lib/command/smartthings-command.js')


test('smartThingsCommandBuilder', () => {
	const { envMock, optionMock, argvMock } = buildArgvMock<object, SmartThingsCommandFlags>()

	expect(smartThingsCommandBuilder(argvMock)).toBe(argvMock)

	expect(envMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
})

describe('smartThingsCommand', () => {
	const defaultLogConfig = { config: 'default' } as unknown as log4js.Configuration
	buildDefaultLog4jsConfigMock.mockReturnValue(defaultLogConfig)
	const logConfig = { config: 'final' } as unknown as log4js.Configuration
	loadLog4jsConfigMock.mockReturnValue(logConfig)
	const booleanConfigValueMock = jest.fn<CLIConfig['booleanConfigValue']>()
		.mockReturnValue(true)
	const cliConfig = {
		profile: {},
		booleanConfigValue: booleanConfigValueMock,
	} as unknown as CLIConfig
	loadConfigMock.mockResolvedValue(cliConfig)

	// TODO: write more complete tests here!
	it('works', async () => {
		const flags = { profile: 'default' }
		const result = await smartThingsCommand(flags)

		expect(result.flags).toBe(flags)

		expect(buildDefaultLog4jsConfigMock).toHaveBeenCalledTimes(1)
		expect(buildDefaultLog4jsConfigMock).toHaveBeenCalledWith(expect.stringMatching('/smartthings.log'))
		expect(loadLog4jsConfigMock).toHaveBeenCalledTimes(1)
		expect(loadLog4jsConfigMock).toHaveBeenCalledWith(expect.stringContaining('/logging.yaml'), defaultLogConfig)
		expect(configureMock).toHaveBeenCalledTimes(1)
		expect(configureMock).toHaveBeenCalledWith(logConfig)
		expect(getLoggerMock).toHaveBeenCalledTimes(1)
		expect(getLoggerMock).toHaveBeenCalledWith('cli')
		expect(loadConfigMock).toHaveBeenCalledTimes(1)
		expect(loadConfigMock).toHaveBeenCalledWith({
			configFilename: expect.stringContaining('/.config/@smartthings/cli/config.yaml'),
			managedConfigFilename: expect.stringContaining('/Library/Caches/@smartthings/cli/config-managed.yaml'),
			profileName: 'default',
		}, loggerMock)
		expect(defaultTableGeneratorMock).toHaveBeenCalledTimes(1)
		expect(defaultTableGeneratorMock).toHaveBeenCalledWith({ groupRows: true })
	})
})
