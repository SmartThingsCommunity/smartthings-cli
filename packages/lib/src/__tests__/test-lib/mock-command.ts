import { NoLogLogger } from '@smartthings/core-sdk'

import { SmartThingsCommandInterface } from '../../smartthings-command'
import { DefaultTableGenerator } from '../../table-generator'


export const exitMock = jest.fn() as jest.Mock<never, [code?: number]>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildMockCommand(flags: { [name: string]: any } = {}, profileConfig: { [name: string]: any } = {}): SmartThingsCommandInterface {
	return {
		logger: new NoLogLogger(),
		flags,
		profileConfig,
		tableGenerator: new DefaultTableGenerator(true),
		exit: exitMock,
	}
}
