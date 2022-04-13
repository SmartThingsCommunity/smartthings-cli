import { Logger } from '@log4js-node/log4js-api'
import { CLIConfig, Profile, ProfilesByName } from '../../cli-config'
import { SmartThingsCommandInterface } from '../../smartthings-command'
import { DefaultTableGenerator } from '../../table-generator'


export const exitMock = jest.fn() as jest.Mock<never, [code?: number]>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildMockCommand(flags: { [name: string]: any } = {}, profile: Profile = {}): SmartThingsCommandInterface {
	return {
		logger: {} as Logger,
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
	}
}
