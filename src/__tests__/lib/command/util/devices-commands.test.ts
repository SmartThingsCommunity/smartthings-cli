import { jest } from '@jest/globals'

import type { cancelCommand } from '../../../../lib/util.js'
import type { isIndexArgument } from '../../../../lib/command/command-util.js'
import type { attributeTypeDisplayString } from '../../../../lib/command/util/capabilities-util.js'


const cancelCommandMock = jest.fn<typeof cancelCommand>()
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	cancelCommand: cancelCommandMock,
}))

const isIndexArgumentMock = jest.fn<typeof isIndexArgument>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	isIndexArgument: isIndexArgumentMock,
}))

const attributeTypeDisplayStringMock = jest.fn<typeof attributeTypeDisplayString>()
jest.unstable_mockModule('../../../../lib/command/util/capabilities-util.js', () => ({
	attributeTypeDisplayString: attributeTypeDisplayStringMock,
}))


const { parseDeviceCommand } = await import('../../../../lib/command/util/devices-commands.js')


describe('parseDeviceCommand', () => {
	it('should this even work?', () => {
		expect(parseDeviceCommand('')).toStrictEqual({
			component: '',
			capability: '',
			command: '',
			arguments: [],
		})
	})
	it('this also seems like it should not work', () => {
		expect(parseDeviceCommand('oneThing')).toStrictEqual({
			component: 'oneThing',
			capability: '',
			command: '',
			arguments: [],
		})
	})
})
