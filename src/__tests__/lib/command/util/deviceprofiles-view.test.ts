import { type PresentationDeviceConfig } from '@smartthings/core-sdk'


const {
	augmentPresentation,
	augmentPresentationEntries,
	prunePresentation,
	prunePresentationEntries,
} = await import('../../../../lib/command/util/deviceprofiles-view.js')


const entry1PrunedOnlyMain = {
	capability: 'capability-id-1',
	values: [{ key: 'key' }],
}
const entry1Pruned = {
	...entry1PrunedOnlyMain,
	component: 'main',
}
const entry1 = {
	...entry1Pruned,
	component: 'main',
	version: 1,
}
const entry2Pruned = {
	component: 'second',
	capability: 'capability-id-2',
}
const entry2 = {
	...entry2Pruned,
	version: 1,
}
const entry3Pruned = {
	component: 'second',
	capability: 'capability-id-2',
	version: 2,
}
const entry3 = {
	...entry3Pruned,
}

const baseView: PresentationDeviceConfig = {
	manufacturerName: 'deleted',
	presentationId: 'deleted',
	type: 'profile',
	iconUrl: 'icon-url',
}

describe('prunePresentationEntries', () => {
	it('returns empty array for empty input', () => {
		expect(prunePresentationEntries([])).toStrictEqual([])
	})

	it('prunes main component and version', () => {
		expect(prunePresentationEntries([entry1])).toStrictEqual([entry1PrunedOnlyMain])
	})

	it('does not prune component when there is more than just main', () => {
		expect(prunePresentationEntries([entry1, entry2])).toStrictEqual([entry1Pruned, entry2Pruned])
	})

	it('removed empty values array', () => {
		expect(prunePresentationEntries([{ ...entry2, values: [] }])).toStrictEqual([entry2Pruned])
	})
})

describe('prunePresentation', () => {
	it('removes top-level fields', () => {
		expect(prunePresentation(baseView)).toStrictEqual({ iconUrl: 'icon-url' })
	})

	it('removes null dpInfo', () => {
		const view = {
			dpInfo: null,
			iconUrl: 'icon-url',
		} as unknown as PresentationDeviceConfig
		expect(prunePresentation(view)).toStrictEqual({ iconUrl: 'icon-url' })
	})

	it('removes null iconURL', () => {
		const view = {
			dpInfo: [],
			iconUrl: null,
		} as unknown as PresentationDeviceConfig
		expect(prunePresentation(view)).toStrictEqual({ dpInfo: [] })
	})

	it('prunes dashboard entries', () => {
		const view: PresentationDeviceConfig = {
			...baseView,
			dashboard: {
				states: [entry1],
				actions: [entry2],
			},
		}

		expect(prunePresentation(view)).toStrictEqual({
			iconUrl: 'icon-url',
			dashboard: {
				states: [entry1PrunedOnlyMain],
				actions: [entry2Pruned],
			},
		})
	})

	it('prunes detailView entries', () => {
		const view: PresentationDeviceConfig = {
			...baseView,
			detailView: [entry1],
		}

		expect(prunePresentation(view)).toStrictEqual({
			iconUrl: 'icon-url',
			detailView: [entry1PrunedOnlyMain],
		})
	})

	it('prunes automation entries', () => {
		const view: PresentationDeviceConfig = {
			...baseView,
			automation: {
				conditions: [entry1],
				actions: [entry2],
			},
		}

		expect(prunePresentation(view)).toStrictEqual({
			iconUrl: 'icon-url',
			automation: {
				conditions: [entry1PrunedOnlyMain],
				actions: [entry2Pruned],
			},
		})
	})
})

describe('augmentPresentationEntries', () => {
	it('returns empty array for empty array input', () => {
		expect(augmentPresentationEntries([])).toStrictEqual([])
	})

	it('uses "main" for component if omitted', () => {
		expect(augmentPresentationEntries([entry1Pruned, entry2Pruned])).toStrictEqual([entry1, entry2])
	})

	it('adds version 1 if omitted', () => {
		expect(augmentPresentationEntries([entry2Pruned, entry3Pruned])).toStrictEqual([entry2, entry3])
	})
})

describe('augmentPresentation', () => {
	it('augments dashboard entries', () => {
		const view = {
			dashboard: {
				states: [entry1PrunedOnlyMain],
				actions: [entry2Pruned],
			},
		}

		expect(augmentPresentation(view)).toStrictEqual({
			dashboard: {
				states: [entry1],
				actions: [entry2],
			},
		})
	})

	it('augments detailView entries', () => {
		const view = {
			detailView: [entry1PrunedOnlyMain],
		}

		expect(augmentPresentation(view)).toStrictEqual({
			detailView: [entry1],
		})
	})

	it('augments automation entries', () => {
		const view = {
			automation: {
				conditions: [entry1PrunedOnlyMain],
				actions: [entry2Pruned],
			},
		}

		expect(augmentPresentation(view)).toStrictEqual({
			automation: {
				conditions: [entry1],
				actions: [entry2],
			},
		})
	})
})
