import { type Invitation } from '../../edge/endpoints/invites.js'
import { type EdgeCommand } from '../edge-command.js'


export const buildListFunction = (command: EdgeCommand, channelId?: string) => async (): Promise<Invitation[]> => {
	const channelIds = channelId
		? [channelId]
		: (await command.client.channels.list()).map(channel => channel.channelId)
	return (await Promise.all(channelIds.map(
		async channelId => await command.edgeClient.invites.list(channelId),
	))).flat()
}
