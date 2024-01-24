import { jest } from '@jest/globals'

import {
	CapabilitiesEndpoint,
	CapabilityNamespace,
	LocationItem,
	LocationsEndpoint,
	OrganizationsEndpoint,
	Room,
	RoomsEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import {
	forAllNamespaces,
	forAllOrganizations,
	withLocation,
	withLocations,
	withLocationAndRoom,
	withLocationsAndRooms,
} from '../../lib/api-helpers.js'


const locations = [
	{ locationId: 'uno', name: 'main location' },
	{ locationId: 'dos', name: 'vacation home' },
] as LocationItem[]
const locationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>().mockResolvedValue(locations)

const roomsByLocationId: Map<string, Room[]> = new Map([
	['uno', [{ roomId: 'twelve', name: 'garage' }, { roomId: 'unnamed' }, { name: 'no id' }]],
	['dos', [{ roomId: 'thirteen', name: 'kitchen' }, { roomId: 'fourteen', name: 'living room' }]],
])
const roomsListMock = jest.fn<typeof RoomsEndpoint.prototype.list>(async locationId => {
	let rooms: Room[] | undefined
	if (locationId && roomsByLocationId.has(locationId)) {
		rooms = roomsByLocationId.get(locationId)
		if (rooms) {
			return rooms
		}
	}
	throw Error('Request failed with status code 403')
})

const client = {
	locations: {
		list: locationsListMock,
	},
	rooms: {
		list: roomsListMock,
	},
} as unknown as SmartThingsClient

describe('withLocations', () => {
	it('updates simple object', async () => {
		const things = [
			{ locationId: 'uno', other: 'field' },
		]

		const updated = await withLocations(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(things)
		expect(updated).toEqual([{ ...things[0], location: 'main location' }])
	})

	it('succeeds even with no locationId', async () => {
		const things = [
			{ locationId: 'uno', other: 'field' },
			{ another: 'value' },
		]

		const updated = await withLocations(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(things)
		expect(updated).toEqual([
			{ ...things[0], location: 'main location' },
			{ ...things[1], location: '' },
		])
	})

	it('notes bad locationId', async () => {
		// The API shouldn't allow bad location ids so this shouldn't happen.
		const things = [
			{ locationId: 'uno', other: 'field' },
			{ locationId: 'invalid-location-id', another: 'value' },
		]

		const updated = await withLocations(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(things)
		expect(updated).toEqual([
			{ ...things[0], location: 'main location' },
			{ ...things[1], location: '<invalid locationId>' },
		])
	})
})

describe('withLocation', () => {
	it('updates simple object', async () => {
		const thing = { locationId: 'uno', other: 'field' }

		const updated = await withLocation(client, thing)

		expect(locationsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(thing)
		expect(updated).toEqual({ ...thing, location: 'main location' })
	})
})

describe('withLocationsAndRooms', () => {
	it('updates simple object', async () => {
		const thing = [
			{ locationId: 'uno', roomId: 'twelve', other: 'field' },
		]

		const updated = await withLocationsAndRooms(client, thing)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(thing)
		expect(updated).toEqual([{ ...thing[0], location: 'main location', room: 'garage' }])
	})

	it('succeeds even with no locationId', async () => {
		const things = [
			{ locationId: 'uno', roomId: 'twelve', other: 'field' },
			{ another: 'value', roomId: 'twelve' },
		]

		const updated = await withLocationsAndRooms(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(things)
		expect(updated).toEqual([
			{ ...things[0], location: 'main location', room: 'garage' },
			{ ...things[1], location: '', room: '' },
		])
	})

	it('fails with bad locationId', async () => {
		// The API shouldn't allow bad location ids so this shouldn't happen.
		const things = [
			{ locationId: 'uno', roomId: 'twelve', other: 'field' },
			{ locationId: 'invalid-location-id', roomId: 'twelve', another: 'value' },
		]

		await expect(withLocationsAndRooms(client, things))
			.rejects.toThrow('Request failed with status code 403')

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(2)
	})

	it('succeeds even with no roomId', async () => {
		const things = [
			{ locationId: 'uno', roomId: 'twelve', other: 'field' },
			{ another: 'value', locationId: 'dos' },
		]

		const updated = await withLocationsAndRooms(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(2)

		expect(updated).not.toEqual(things)
		expect(updated).toEqual([
			{ ...things[0], location: 'main location', room: 'garage' },
			{ ...things[1], location: 'vacation home', room: '' },
		])
	})

	it('handles room with no id', async () => {
		// This seems odd but the roomId field is not required in the API.
		const thing = [
			{ locationId: 'uno', other: 'field' },
		]

		const updated = await withLocationsAndRooms(client, thing)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(thing)
		expect(updated).toEqual([{ ...thing[0], location: 'main location', room: '' }])
	})

	it('handles unnamed room', async () => {
		const things = [
			{ locationId: 'uno', roomId: 'unnamed', other: 'field' },
		]

		const updated = await withLocationsAndRooms(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(things)
		expect(updated).toEqual([{ ...things[0], location: 'main location', room: '' }])
	})

	it('succeeds even with bad roomId', async () => {
		const things = [
			{ locationId: 'uno', roomId: 'twelve', other: 'field' },
			{ locationId: 'dos', roomId: 'not-a-real-room', another: 'value' },
		]

		const updated = await withLocationsAndRooms(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(2)

		expect(updated).not.toEqual(things)
		expect(updated).toEqual([
			{ ...things[0], location: 'main location', room: 'garage' },
			{ ...things[1], location: 'vacation home', room: '' },
		])
	})

	it('calls rooms only once for each locationId', async () => {
		const things = [
			{ locationId: 'uno', roomId: 'twelve', other: 'field' },
			{ locationId: 'dos', roomId: 'thirteen', other: 'field' },
			{ locationId: 'dos', roomId: 'fourteen', other: 'field' },
			{ locationId: 'uno', roomId: 'twelve', other: 'field' },
		]

		const updated = await withLocationsAndRooms(client, things)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(2)

		expect(updated).not.toEqual(things)
		expect(updated.length).toBe(4)
		expect(updated).toEqual([
			{ ...things[0], location: 'main location', room: 'garage' },
			{ ...things[1], location: 'vacation home', room: 'kitchen' },
			{ ...things[2], location: 'vacation home', room: 'living room' },
			{ ...things[3], location: 'main location', room: 'garage' },
		])
	})
})

describe('withLocationAndRoom', () => {
	it('updates simple object', async () => {
		const thing = { locationId: 'uno', roomId: 'twelve', other: 'field' }

		const updated = await withLocationAndRoom(client, thing)

		expect(locationsListMock).toHaveBeenCalledTimes(1)
		expect(roomsListMock).toHaveBeenCalledTimes(1)

		expect(updated).not.toEqual(thing)
		expect(updated).toEqual({ ...thing, location: 'main location', room: 'garage' })
	})
})

describe('forAllOrganizations', () => {
	const organizationsListMock = jest.fn<typeof OrganizationsEndpoint.prototype.list>()
	const org1Client = {
		isFor: 'Organization 1',
	} as unknown as SmartThingsClient
	const org2Client = {
		isFor: 'Organization 1',
	} as unknown as SmartThingsClient
	const cloneMock = jest.fn()
	const client = {
		organizations: {
			list: organizationsListMock,
		},
		clone: cloneMock,
	} as unknown as SmartThingsClient

	const organization1 = { organizationId: 'organization-1-id', name: 'Organization 1' }
	const organization2 = { organizationId: 'organization-2-id', name: 'Organization 2' }

	it('combines multiple results', async () => {
		organizationsListMock.mockResolvedValueOnce([organization1, organization2])
		cloneMock.mockReturnValueOnce(org1Client)
		cloneMock.mockReturnValueOnce(org2Client)
		const query = jest.fn<Parameters<typeof forAllOrganizations>[1]>()
			.mockResolvedValueOnce([
				{ name: 'thing 1' },
				{ name: 'thing 2' },
			])
			.mockResolvedValueOnce([{ name: 'thing 3' }])

		expect(await forAllOrganizations(client, query)).toStrictEqual([
			{ name: 'thing 1', organization: 'Organization 1' },
			{ name: 'thing 2', organization: 'Organization 1' },
			{ name: 'thing 3', organization: 'Organization 2' },
		])

		expect(organizationsListMock).toHaveBeenCalledTimes(1)
		expect(organizationsListMock).toHaveBeenCalledWith()

		expect(query).toHaveBeenCalledTimes(2)
		expect(query).toHaveBeenCalledWith(org1Client, organization1)
		expect(query).toHaveBeenCalledWith(org2Client, organization2)
	})
})

describe('forAllNamespaces', () => {
	const listNamespacesMock = jest.fn<typeof CapabilitiesEndpoint.prototype.listNamespaces>()
	const capabilities = {
		listNamespaces: listNamespacesMock,
	} as unknown as CapabilitiesEndpoint
	const client = { capabilities } as SmartThingsClient
	const queryMock = jest.fn<Parameters<typeof forAllNamespaces>[1]>()
	const namespace1 = { name: 'namespace1' } as CapabilityNamespace
	const namespace2 = { name: 'namespace2' } as CapabilityNamespace

	it('combines multiple results', async () => {
		listNamespacesMock.mockResolvedValueOnce([namespace1, namespace2])

		const ns1Items = [{ num: 1, str: 'str1' }]
		const ns2Items = [{ num: 2, str: 'str2' }, { num: 3, str: 'str3' }]
		queryMock.mockResolvedValueOnce(ns1Items)
		queryMock.mockResolvedValueOnce(ns2Items)

		expect(await forAllNamespaces(client, queryMock)).toStrictEqual([...ns1Items, ...ns2Items])

		expect(listNamespacesMock).toHaveBeenCalledTimes(1)
		expect(listNamespacesMock).toHaveBeenCalledWith()
		expect(queryMock).toHaveBeenCalledTimes(2)
		expect(queryMock).toHaveBeenCalledWith(namespace1)
		expect(queryMock).toHaveBeenCalledWith(namespace2)
	})
})
