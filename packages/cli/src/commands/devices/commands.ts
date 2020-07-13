import { Device, Command, Status } from '@smartthings/core-sdk'

import {APICommand, SelectingInputOutputAPICommand} from '@smartthings/cli-lib'

import inquirer from 'inquirer'


export function buildTableOutput(this: APICommand, data: Status): string {
	return data.status === 'success' ? 'Command executed successfully' : `Execution status = ${data.status}`
}

export default class DeviceCommandsCommand extends SelectingInputOutputAPICommand<Command[], Status, Device> {
	static description = "get the current status of all of a device's component's attributes"

	static flags = SelectingInputOutputAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
	]

	protected buildTableOutput = buildTableOutput

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']

	protected async getInputFromUser(): Promise<Command[]> {
		const cmd = (await inquirer.prompt({
			type: 'input',
			name: 'deviceCommand',
			message: 'Enter device command [component:]<capability>:<command>([<arguments]>):',
			validate: (input: string) => {
				// switch:on
				// switch:on()
				// outlet1:switch:on()
				// switchLevel:setLevel(20)
				return new RegExp(/^([a-zA-Z0-9]+:)?[a-zA-Z0-9]+:[a-zA-Z0-9]+(\(.*\))?$/).test(input) || 'Invalid command syntax'
			},
		})).deviceCommand

		return parseDeviceCommand(cmd)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceCommandsCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id, data) => this.client.devices.executeCommands(id, data),
		)
	}
}

function parseDeviceCommand(str: string): Command[] {
	let cmdStr = str
	let args = []
	const pos = str.indexOf('(')
	if (pos > 0) {
		cmdStr = str.slice(0, pos)
		const argStr = str.slice(pos+1, -1)
		args = JSON.parse(`[${argStr}]`)
	}

	const segs = cmdStr.split(':')
	const component = segs.length === 3 ? segs[0] : 'main'
	const capability = segs.length === 3 ? segs[1] : segs[0]
	const command = segs.length === 3 ? segs[2] : segs[1]
	return [
		{
			component: component,
			capability: capability.replace(':','.'),
			command: command,
			arguments: args,
		},
	]
}
