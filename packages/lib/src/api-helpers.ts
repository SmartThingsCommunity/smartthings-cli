import { SmartThingsClient, OrganizationResponse, CapabilityNamespace } from '@smartthings/core-sdk'


export interface WithLocation {
	locationId?: string
}

export interface WithNamedLocation extends WithLocation {
	location?: string
}

export interface WithRoom extends WithLocation {
	roomId?: string
}

export interface WithNamedRoom extends WithNamedLocation, WithRoom {
	room?: string
}

export interface WithOrganization {
	organization?: string
}

const buildLocationNamesById = async (client: SmartThingsClient): Promise<Map<string, string>> => {
	const locations = await client.locations.list()
	return new Map(locations.map(location => [location.locationId, location.name]))
}

export const withLocations = async <T>(client: SmartThingsClient, list: (T & WithLocation)[]): Promise<(T & WithNamedLocation)[]> => {
	const locationNameById = await buildLocationNamesById(client)

	const withLocation = <T extends WithLocation>(item: T): T & WithNamedLocation =>
		({ ...item, location: item.locationId ? locationNameById.get(item.locationId) ?? '<invalid locationId>' : '' })

	return list.map(item => withLocation(item))
}

export const withLocation = async <T>(client: SmartThingsClient, item: T): Promise<T & WithNamedLocation> =>
	(await withLocations(client, [item]))[0]

const notEmpty = <T>(value: T | null | undefined): value is T => {
	return value !== null && value !== undefined
}

const uniqueLocationIds = (list: WithLocation[]): string[] => {
	// Note -- the `.filter(notEmpty))` is here because the source types such
	// as InstalledApp are currently defined with optional locationId even
	// though locationId is actually always set. The filter can be removed
	// once that issue is corrected.
	return Array.from(new Set(list.map(item => item.locationId).filter(notEmpty)))
}

export const withLocationsAndRooms = async <T extends WithRoom>(client: SmartThingsClient, list: T[]): Promise<(T & WithNamedRoom)[]> => {
	const locationNameById = await buildLocationNamesById(client)
	const locationIds = uniqueLocationIds(list)
	const roomNamesById = new Map((await Promise.all(locationIds.map((locationId) => {
		return client.rooms.list(locationId)
	}))).flat().map(room => [room.roomId ?? '', room.name ?? ''] as [string, string]))

	return list.map(item => {
		let location = ''
		let room = ''
		if (item.locationId) {
			location = locationNameById.get(item.locationId) ?? ''

			if (item.roomId) {
				room = roomNamesById.get(item.roomId) ?? ''
			}
		}
		return { ...item, location, room }
	})
}

export async function forAllOrganizations<T>(
		client: SmartThingsClient,
		query: (orgClient: SmartThingsClient, org: OrganizationResponse) => Promise<T[]>): Promise<(T & WithOrganization)[]> {
	const organizations = await client.organizations.list()
	const nestedItems = await Promise.all(organizations.map(async (org) => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const orgClient = client.clone({ 'X-ST-Organization': org.organizationId })
		const items = await query(orgClient, org)
		return items.map(item => ({ ...item, organization: org.name }))
	}))
	return nestedItems.flat()
}

export async function forAllNamespaces<T>(
		client: SmartThingsClient,
		query: (namespace: CapabilityNamespace) => Promise<T[]>): Promise<T[]> {
	const namespaces = await client.capabilities.listNamespaces()
	const nestedItems = await Promise.all(namespaces.map(async (namespace) => query(namespace)))
	return nestedItems.flat()
}
