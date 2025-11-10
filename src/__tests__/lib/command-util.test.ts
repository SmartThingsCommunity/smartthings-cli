import { jest } from '@jest/globals'

import { type CommandModule } from 'yargs'


// Single consolidated mock command set covering all test scenarios
const noop = (): void => { /* unused */ }
const devicesStatusCommand = { command: 'devices:status', describe: 'device status', handler: noop }
const devicesUpdateCommand = { command: 'devices:update', describe: 'update device', handler: noop }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCommands: CommandModule<object, any>[] = [
	{ command: 'other:thing', describe: 'other thing', handler: noop },
	{ command: 'unrelated', describe: 'unrelated', handler: noop },
	devicesStatusCommand,
	{ command: 'devices:history:list', describe: 'device history list', handler: noop },
	devicesUpdateCommand,
	{ command: 'devices:history:list:detail', describe: 'history detail', handler: noop },
	{ describe: 'a command without a command', handler: noop },
	{ command: ['aliased', 'alias'], describe: 'a command with more than one name', handler: noop },
]
jest.unstable_mockModule('../../commands/index.js', () => ({
	commands: mockCommands,
}))

const { findTopicsAndSubcommands } = await import('../../lib/command-util.js')

describe('findTopicsAndSubcommands', () => {
	it('returns no topics or sub-commands for a leaf command', () => {
		expect(findTopicsAndSubcommands('devices:update')).toStrictEqual({ topics: [], subCommands: [] })
	})

	it('returns direct, and only direct, sub-commands and topics for devices', () => {
		const result = findTopicsAndSubcommands('devices')
		expect(result).toStrictEqual({
			topics: ['devices::history'],
			subCommands: [
				{ relatedName: 'devices:status', command: devicesStatusCommand },
				{ relatedName: 'devices:update', command: devicesUpdateCommand },
			],
		})
	})
})
