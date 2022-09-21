import inquirer from 'inquirer'

import { Channel, ChannelCreate } from '@smartthings/core-sdk'

import { inputAndOutputItem, userInputProcessor } from '@smartthings/cli-lib'

import { EdgeCommand } from '../../../lib/edge-command'


const tableFieldDefinitions = ['channelId', 'name', 'description', 'type', 'termsOfServiceUrl',
	'createdDate', 'lastModifiedDate']

export default class ChannelsCreateCommand extends EdgeCommand<typeof ChannelsCreateCommand.flags> {
	static description = 'create a channel'

	static flags = {
		...EdgeCommand.flags,
		...inputAndOutputItem.flags,
	}

	async getInputFromUser(): Promise<ChannelCreate> {
		const name = (await inquirer.prompt({
			type: 'input',
			name: 'name',
			message: 'Channel name:',
			validate: input => input ? true : 'name is required',
		})).name as string

		const description = (await inquirer.prompt({
			type: 'input',
			name: 'description',
			message: 'Channel description:',
			validate: input => input ? true : 'description is required',
		})).description as string

		const termsOfServiceUrl = (await inquirer.prompt({
			type: 'input',
			name: 'termsOfServiceUrl',
			message: 'Channel terms of service URL:',
			validate: input => input ? true : 'termsOfServiceUrl is required',
		})).termsOfServiceUrl as string

		return { name, description, termsOfServiceUrl, type: 'DRIVER' }
	}

	async run(): Promise<void> {
		await inputAndOutputItem<ChannelCreate, Channel>(this, { tableFieldDefinitions },
			(_, input: ChannelCreate) => this.client.channels.create(input),
			userInputProcessor(this))
	}
}
