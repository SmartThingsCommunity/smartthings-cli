import fs from 'fs'
import open from 'open'
import Table from 'cli-table'

import { APICommand } from '@smartthings/cli-lib'
import { Capability } from '@smartthings/core-sdk'


export default class Capabilities extends APICommand {
	static description = "get a specific capability from a user's account"

	static flags = {
		...APICommand.outputFlags,
		...APICommand.flags,
		...APICommand.jsonFlags,
	}

	static args = [
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

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Capabilities)
		await super.setup(argv, flags)
		this.client.capabilities.get(args.id, args.version).then(async capability => {
			if(flags.output){
				//default JSON output spacing set to 4
				fs.writeFile(flags.output, JSON.stringify(capability, null, flags['json-space'] || 4), () => {
					//open newly written file
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					open(flags.output!)
				})
			} else if(flags.json) {
				this.log(JSON.stringify(capability, null, flags['json-space'] || 4))
			} else {
				new CapabilityLogging().printCapabilityTable(capability)
			}
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}

export class CapabilityLogging {
	//Standard Output
	public printCapabilityTable = (capability: Capability) => {
		console.log(`\n\nCapability: ${capability.name}\n`)
		if (capability.attributes) {
			this.logTable(capability, SubItemTypes.ATTRIBUTES)
		}
		if (capability.commands) {
			this.logTable(capability, SubItemTypes.COMMANDS)
		}
	}
	private logTable = (capability: Capability, type: SubItemTypes) => {
		type === SubItemTypes.ATTRIBUTES ? console.log('\nAttributes:') : console.log('\nCommands:')
		const headers = type === SubItemTypes.ATTRIBUTES ? ['Name', 'Type', 'Setter'] : ['Name', '# of Arguments']
		const table = new Table({
			head: headers,
			colWidths: headers.map(() => {
				return 30
			}),
		})
		for (const name in capability[type]) {
			if (type === SubItemTypes.ATTRIBUTES) {
				const subItem = capability[SubItemTypes.ATTRIBUTES]![name]
				table.push([name, subItem.schema.properties.value.type, subItem.setter || 'N/A'])
			} else {
				const subItem = capability[SubItemTypes.COMMANDS]![name]
				table.push([name, subItem!.arguments!.length])
			}
		}
		console.log(table.toString())
	}
}


enum SubItemTypes {
	COMMANDS = 'commands',
	ATTRIBUTES = 'attributes'
}
