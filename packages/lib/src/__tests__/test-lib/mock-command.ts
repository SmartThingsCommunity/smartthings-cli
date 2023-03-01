import log4js from '@log4js-node/log4js-api'
import { CLIConfig, Profile, ProfilesByName } from '../../cli-config'
import { SmartThingsCommandInterface } from '../../smartthings-command'
import { DefaultTableGenerator } from '../../table-generator'


export const exitMock = jest.fn() as jest.Mock<never, [code?: number]>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logToStderrMock: jest.Mock<void, [string, any[]]> = jest.fn()
export const cancelMock: jest.Mock<void, [string | undefined]> = jest.fn()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildMockCommand(flags: { [name: string]: any } = {}, profile: Profile = {}): SmartThingsCommandInterface {
	return {
		logger: log4js.getLogger('cli'),
		flags,
		cliConfig: {
			profileName: 'default',
			mergedProfiles: { default: { profile } } as ProfilesByName,
			profile,
		} as CLIConfig,
		profile,
		tableGenerator: new DefaultTableGenerator(true),
		stringConfigValue: jest.fn(),
		stringArrayConfigValue: jest.fn(),
		booleanConfigValue: jest.fn(),
		exit: exitMock,
		logToStderr: logToStderrMock,
		cancel: (message?: string): never => {
			cancelMock(message)
			throw Error('never return')
		},
	}
}
