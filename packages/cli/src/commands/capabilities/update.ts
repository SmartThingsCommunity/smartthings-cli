import { flags } from '@oclif/command'

import { CapabilityUpdate } from '@smartthings/core-sdk/src/endpoint/capabilities'

import { APICommand } from '@smartthings/cli-lib'


export default class CapabilitiesUpdate extends APICommand {
	static description = 'update a capability'

	static flags = {
		...APICommand.flags,
		data: flags.string({
			char: 'd',
			description: 'JSON data for capability',
		}),
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

	private updateAndDisplay(capabilityId: string, capabilityVersion: number, capability: CapabilityUpdate): void {
		this.client.capabilities.update(capabilityId, capabilityVersion, capability)
			.then(updatedCapability => {
				this.log(JSON.stringify(updatedCapability, null, 4))
			})
			.catch(err => {
				this.log(`caught error ${err}`)
			})
	}

	async run(): Promise<void> {
		const { args, flags } = this.parse(CapabilitiesUpdate)
		await super.setup(args, flags)

		if (flags.data) {
			const capability: CapabilityUpdate = JSON.parse(flags.data)
			this.updateAndDisplay(args.id, args.version, capability)
		} else {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				inputChunks.push(chunk.toString())
			})
			stdin.on('end', () => {
				const capability = JSON.parse(inputChunks.join())
				this.updateAndDisplay(args.id, args.version, capability)
			})
		}
	}
}
