import Table from 'cli-table'

import { OutputAPICommand } from '@smartthings/cli-lib'
import { Capability } from '@smartthings/core-sdk'


export const capabilityIdInputArgs = [
	{
		name: 'id',
		description: 'the capability id',
		required: true,
	},
	{
		name: 'version',
		description: 'the capability version',
		required: true,
	},
]

export function buildTableOutput(capability: Capability): string {
	enum SubItemTypes {
		COMMANDS = 'commands',
		ATTRIBUTES = 'attributes'
	}

	function makeTable(capability: Capability, type: SubItemTypes): string {
		const headers = type === SubItemTypes.ATTRIBUTES ? ['Name', 'Type', 'Setter'] : ['Name', '# of Arguments']
		const table = new Table({
			head: headers,
			colWidths: headers.map(() => {
				return 30
			}),
		})
		for (const name in capability[type]) {
			if (type === SubItemTypes.ATTRIBUTES) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.ATTRIBUTES]![name]
				table.push([name, subItem.schema.properties.value.type, subItem.setter || ''])
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.COMMANDS]![name]
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				table.push([name, subItem!.arguments!.length])
			}
		}
		return table.toString()
	}

	let output = `\n\nCapability: ${capability.id}\n`
	if (capability.attributes && Object.keys(capability.attributes).length > 0) {
		output += '\n\nAttributes: \n'
		output += makeTable(capability, SubItemTypes.ATTRIBUTES)
	}
	if (capability.commands && Object.keys(capability.commands).length > 0) {
		output += '\n\nCommands: \n'
		output += makeTable(capability, SubItemTypes.COMMANDS)
	}
	return output
}

export default class Capabilities extends OutputAPICommand<Capability> {
	static description = 'get a specific capability'

	static flags = {
		...OutputAPICommand.flags,
	}

	static args = capabilityIdInputArgs

	protected buildTableOutput(capability: Capability): string {
		return buildTableOutput(capability)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Capabilities)
		await super.setup(args, argv, flags)

		this.processNormally(() => {
			return this.client.capabilities.get(args.id, args.version)
		})
	}
}
