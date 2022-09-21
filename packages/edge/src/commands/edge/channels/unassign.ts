import { Flags } from '@oclif/core'

import { DriverChannelDetails } from '@smartthings/core-sdk'

import { APICommand, ChooseOptions, chooseOptionsWithDefaults, selectFromList, SelectFromListConfig, stringTranslateToId } from '@smartthings/cli-lib'

import { chooseChannel } from '../../../lib/commands/channels-util'
import { EdgeCommand } from '../../../lib/edge-command'


export interface NamedDriverChannelDetails extends DriverChannelDetails {
	name: string
}

export async function chooseAssignedDriver(command: APICommand<typeof APICommand.flags>, promptMessage: string,
		channelId: string, commandLineDriverId?: string, options?: Partial<ChooseOptions>): Promise<string> {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<NamedDriverChannelDetails> = {
		itemName: 'driver',
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
	}
	const listItems = async (): Promise<NamedDriverChannelDetails[]> => {
		const driverDetails = await command.client.channels.listAssignedDrivers(channelId)
		return (await Promise.all(driverDetails.map(async details => {
			try {
				const driver = await command.client.drivers.get(details.driverId)
				return { ...details, name: driver.name }
			} catch (error) {
				if (error.response?.status === 404) {
					return { ...details, name: '<deleted driver>' }
				}
				throw error
			}
		})))
	}
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, commandLineDriverId, listItems)
		: commandLineDriverId
	return selectFromList(command, config, { preselectedId, listItems, promptMessage })
}

export class ChannelsUnassignCommand extends EdgeCommand<typeof ChannelsUnassignCommand.flags> {
	static description = 'remove a driver from a channel'

	static flags = {
		...EdgeCommand.flags,
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			helpValue: '<UUID>',
		}),
	}

	static args = [
		{
			name: 'driverId',
			description: 'driver id',
		},
	]

	static aliases = ['edge:drivers:unpublish']

	async run(): Promise<void> {
		const channelId = await chooseChannel(this, 'Select a channel for the driver.',
			this.flags.channel, { useConfigDefault: true })
		const driverId = await chooseAssignedDriver(this, 'Select a driver to remove from channel.',
			channelId, this.args.driverId)

		await this.client.channels.unassignDriver(channelId, driverId)

		this.log(`${driverId} removed from channel ${channelId}`)
	}
}
