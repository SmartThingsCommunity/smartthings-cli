import Table from 'cli-table'

import { APICommand } from '@smartthings/cli-lib'
import { CapabilitySummary } from '@smartthings/core-sdk'


export default class CapabilitiesList extends APICommand {
	static description = 'list all capabilities currently available in a user account'

	static flags = {
		...APICommand.flags,
		...APICommand.outputFlags,
		...APICommand.jsonFlags,
	}

	async run(): Promise<void> {
		const { argv, flags } = this.parse(CapabilitiesList)
		await super.setup(argv, flags)

		this.client.capabilities.list().then(async capabilities => {
			if(flags.json){
				this.log(JSON.stringify(capabilities, null, flags['json-space'] || 4))
			} else {
				this.printCapabilitiesTable(capabilities)
			}
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}

	printCapabilitiesTable(capabilities: CapabilitySummary[]): void {
		const table = new Table({
			head: ['Capability', 'Version', 'Status'],
			colWidths: [30, 30, 30],
		})
		for (const capability of capabilities) {
			table.push([capability.id, capability.version, capability.status || 'N/A'])
		}
		console.log(table.toString())
	}
}
