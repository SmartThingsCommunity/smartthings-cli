// import { expect, test } from '@oclif/test'
import {Command} from '@smartthings/core-sdk'
import {parseDeviceCommand} from '../../commands/devices/commands'


describe('config', () => {
	it('capability command', function() {
		const str = 'switch:on()'
		const cmd = parseDeviceCommand(str)
		expect(cmd.component).toEqual('main')
		expect(cmd.capability).toEqual('switch')
		expect(cmd.command).toEqual('on')
		expect(cmd.arguments).toEqual([])
	})

	it('capability command no parens', function() {
		const str = 'switch:off'
		const cmd = parseDeviceCommand(str)
		expect(cmd.component).toEqual('main')
		expect(cmd.capability).toEqual('switch')
		expect(cmd.command).toEqual('off')
		expect(cmd.arguments).toEqual([])
	})

	it('component, capability, command', function() {
		const str = 'outlet1:switch:on()'
		const cmd = parseDeviceCommand(str)
		expect(cmd.component).toEqual('outlet1')
		expect(cmd.capability).toEqual('switch')
		expect(cmd.command).toEqual('on')
		expect(cmd.arguments).toEqual([])
	})

	it('capability command one argument', function() {
		const str = 'switchLevel:setLevel(50)'
		const cmd = parseDeviceCommand(str)
		expect(cmd.component).toEqual('main')
		expect(cmd.capability).toEqual('switchLevel')
		expect(cmd.command).toEqual('setLevel')
		expect(cmd.arguments).toEqual([50])
	})

	it('capability command two arguments', function() {
		const str = 'switchLevel:setLevel(50, 15)'
		const cmd = parseDeviceCommand(str)
		expect(cmd.component).toEqual('main')
		expect(cmd.capability).toEqual('switchLevel')
		expect(cmd.command).toEqual('setLevel')
		expect(cmd.arguments).toEqual([50, 15])
	})

	it('only component', function() {
		const str = 'outlet1'
		const cmd = parseDeviceCommand(str)
		expect(cmd.component).toEqual('outlet1')
		expect(cmd.capability).toEqual('')
		expect(cmd.command).toEqual('')
		expect(cmd.arguments).toEqual([])
	})

	it('component qualified', function() {
		const str = 'switchLevel:setLevel(80)'
		const cmd = parseDeviceCommand(str, 'outlet1')
		expect(cmd.component).toEqual('outlet1')
		expect(cmd.capability).toEqual('switchLevel')
		expect(cmd.command).toEqual('setLevel')
		expect(cmd.arguments).toEqual([80])
	})

	it('only capability', function() {
		const str = 'switch'
		const cmd = parseDeviceCommand(str, 'outlet1')
		expect(cmd.component).toEqual('outlet1')
		expect(cmd.capability).toEqual('switch')
		expect(cmd.command).toEqual('')
		expect(cmd.arguments).toEqual([])
	})

	it('only command', function() {
		const str = 'setVolume(30)'
		const cmd = parseDeviceCommand(str, 'main', 'volumeControl')
		expect(cmd.component).toEqual('main')
		expect(cmd.capability).toEqual('volumeControl')
		expect(cmd.command).toEqual('setVolume')
		expect(cmd.arguments).toEqual([30])
	})
})
