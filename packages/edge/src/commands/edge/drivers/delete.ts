import { EdgeCommand } from '../../../lib/edge-command'
import { chooseDriver } from '../../../lib/commands/drivers-util'


export default class DriversDeleteCommand extends EdgeCommand<typeof DriversDeleteCommand.flags> {
	static description = 'delete an edge driver'

	static flags = EdgeCommand.flags

	static args = [{
		name: 'id',
		description: 'driver UUID',
	}]

	async run(): Promise<void> {
		const id = await chooseDriver(this, 'Select a driver to delete.', this.args.id)
		await this.client.drivers.delete(id)
		this.log(`Driver ${id} deleted.`)
	}
}
