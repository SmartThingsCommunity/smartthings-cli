import fs from 'fs'
import Table from 'cli-table'
import yaml from 'js-yaml'


import { APICommand } from '@smartthings/cli-lib'
import { Capability, CapabilitySummary, Namespace } from '@smartthings/core-sdk'


export default class Capabilities extends APICommand {
	static description = "get a specific capability from a user's account"

	static flags = {
		...APICommand.flags,
		...APICommand.outputFlags,
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
			//Create the output content based on flags
			const capabilityDefaultOutput = new CapabilityDefaultOutput()
			let output

			if (flags.json || capabilityDefaultOutput.allowedOutputFileType(flags.output, true)) {
				output = JSON.stringify(capability, null, flags.indent || 4)
			} else if (flags.yaml || capabilityDefaultOutput.allowedOutputFileType(flags.output, false)) {
				output = yaml.safeDump(capability, {indent: flags.indent || 2 })
			} else {
				output = capabilityDefaultOutput.makeCapabilityTable(capability)
			}

			//decide how to output the content based on flags
			if (flags.output) {
				fs.writeFile(flags.output, output, () => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					this.log(`file created: ${flags.output}`)
				})
			} else {
				this.log(output)
			}
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}

export class CapabilityDefaultOutput {
	//Default Output
	public makeCapabilityTable = (capability: Capability): string => {
		let output = `\n\nCapability: ${capability.id}\n`
		if (capability.attributes && Object.keys(capability.attributes).length > 0) {
			output += '\n\nAttributes: \n'
			output += this.logTable(capability, SubItemTypes.ATTRIBUTES)
		}
		if (capability.commands && Object.keys(capability.commands).length > 0) {
			output += '\n\nCommands: \n'
			output += this.logTable(capability, SubItemTypes.COMMANDS)
		}
		return output
	}

	public makeCapabilitiesTable(capabilities: CapabilitySummary[]): string {
		const table = new Table({
			head: ['Capability', 'Version', 'Status'],
			colWidths: [80, 10, 10],
		})
		for (const capability of capabilities) {
			table.push([capability.id, capability.version, capability.status || 'N/A'])
		}
		return table.toString()
	}

	private logTable = (capability: Capability, type: SubItemTypes): string => {
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
				table.push([name, subItem.schema.properties.value.type, subItem.setter || 'N/A'])
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.COMMANDS]![name]
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				table.push([name, subItem!.arguments!.length])
			}
		}
		return table.toString()
	}

	public allowedOutputFileType(fileName: string | undefined, jsonFlag: boolean): boolean {
		if (!fileName) {
			return false
		}

		const fileArr = fileName.split('.')
		if (fileArr.length !== 2) {
			return false
		}

		const fileType = fileArr[1]
		if (jsonFlag && fileType !== 'json') {
			return false
		}

		if (!jsonFlag && (fileType !== 'yml' && fileType !== 'yaml')) {
			return false
		}

		return true
	}

	public makeNamespacesTable(namespaces: Namespace[]): string {
		const table = new Table({
			head: ['Namespace', 'Owner Type', 'Owner Id'],
			colWidths: [40, 20, 40],
		})
		for (const namespace of namespaces) {
			table.push([namespace.name, namespace.ownerType, namespace.ownerId])
		}
		return table.toString()
	}
}


enum SubItemTypes {
	COMMANDS = 'commands',
	ATTRIBUTES = 'attributes'
}
