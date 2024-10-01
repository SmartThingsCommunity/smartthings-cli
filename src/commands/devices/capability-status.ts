import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type CapabilityReference, type CapabilityStatus } from '@smartthings/core-sdk'

import {
	apiCommand,
	apiCommandBuilder,
	apiDocsURL,
	type APICommandFlags,
} from '../../lib/command/api-command.js'
import { stringTranslateToId } from '../../lib/command/command-util.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { selectFromList, type SelectFromListConfig } from '../../lib/command/select.js'
import {
	chooseComponentFn,
	chooseDevice,
	prettyPrintAttribute,
} from '../../lib/command/util/devices-util.js'
import { type TableGenerator } from '../../lib/table-generator.js'
import { fatalError } from '../../lib/util.js'


export type CommandArgs = APICommandFlags & FormatAndWriteItemFlags & {
	deviceIdOrIndex?: string
	componentId?: string
	capabilityId?: string
}

const command = 'devices:capability-status [device-id-or-index] [component-id] [capability-id]'

const describe = "get the current status of all of a device capability's attributes"

const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('device-id-or-index',
			{ describe: 'device id or index in list from devices command', type: 'string' })
		.positional('component-id', { describe: 'component id', type: 'string' })
		.positional('capability-id', { describe: 'capability id', type: 'string' })
		.example([
			['$0 devices:capability-status',
				'prompt for a device, component, and capability, then display its status'],
			['$0 devices:capability-status fa1eb54c-c571-405f-8817-ffb7cd2f5a9d',
				'prompt for a component and capability for the specified device'],
			['$0 devices:capability-status fa1eb54c-c571-405f-8817-ffb7cd2f5a9d main switch',
				'display the status for the specified device, component, and capability'],
		])
		.epilog(apiDocsURL('getDeviceStatusByCapability'))

export const buildTableOutput = (
		tableGenerator: TableGenerator,
		capability: CapabilityStatus,
): string => {
	const table = tableGenerator.newOutputTable({ head: ['Attribute', 'Value'] })

	for (const attributeName of Object.keys(capability)) {
		table.push([attributeName, prettyPrintAttribute(capability[attributeName])])
	}

	return table.toString()
}

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDevice(command, argv.deviceIdOrIndex, { allowIndex: true })

	const device = await command.client.devices.get(deviceId)
	const chooseComponent = chooseComponentFn(device)
	const componentId = await chooseComponent(command, argv.componentId, { autoChoose: true })

	const component = device.components?.find(component => component.id === componentId)
	const capabilities = component?.capabilities
	if (!capabilities) {
		return fatalError(`no capabilities found for component ${componentId} of device ${deviceId}`)
	}

	const config: SelectFromListConfig<CapabilityReference> = {
		itemName: 'capability',
		pluralItemName: 'capabilities',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id'],
	}
	const listItems = async (): Promise<CapabilityReference[]> => capabilities
	const preselectedId = await stringTranslateToId(config, argv.capabilityId, listItems)
	const capabilityId = await selectFromList(command, config, { preselectedId, listItems })
	const capabilityStatus = await command.client.devices.getCapabilityStatus(
		deviceId,
		componentId,
		capabilityId,
	)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		capabilityStatus,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
