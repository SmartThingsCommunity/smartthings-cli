import * as output from '../output'
import { buildOutputFormatter } from '../output-builder'
import * as ioUtil from '../io-util'
import { SmartThingsCommandInterface } from '../smartthings-command'
import { buildMockCommand } from './test-lib/mock-command'
import { SimpleType } from './test-lib/simple-type'


describe('buildOutputFormatter', () => {
	let command: SmartThingsCommandInterface
	let jsonFormatterSpy: jest.SpyInstance<output.OutputFormatter<unknown>, [indent: number]>
	let yamlFormatterSpy: jest.SpyInstance<output.OutputFormatter<unknown>, [indent: number]>
	let formatFromFilenameSpy: jest.SpyInstance<ioUtil.IOFormat, [filename: string]>

	beforeEach(() => {
		command = buildMockCommand()
		jsonFormatterSpy = jest.spyOn(output, 'jsonFormatter')
		yamlFormatterSpy = jest.spyOn(output, 'yamlFormatter')
		formatFromFilenameSpy = jest.spyOn(ioUtil, 'formatFromFilename')
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('uses json when specified', () => {
		command.flags.json = true

		buildOutputFormatter<SimpleType>(command)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)

		jsonFormatterSpy.mockReset()
		command.flags.input = 'fn.yaml'
		buildOutputFormatter<SimpleType>(command)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
	})

	it('uses yaml when specified', () => {
		command.flags.yaml = true

		buildOutputFormatter<SimpleType>(command)

		expect(yamlFormatterSpy).toHaveBeenCalledTimes(1)

		yamlFormatterSpy.mockReset()
		command.flags.input = 'fn.json'
		buildOutputFormatter<SimpleType>(command)
		expect(yamlFormatterSpy).toHaveBeenCalledTimes(1)
	})

	it('gets format from filename with input file when not specified', () => {
		formatFromFilenameSpy.mockReturnValue(ioUtil.IOFormat.JSON)
		command.flags.output = 'fn.json'
		buildOutputFormatter<SimpleType>(command)
		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(1)
		expect(formatFromFilenameSpy).toHaveBeenCalledWith('fn.json')
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
		expect(yamlFormatterSpy).toHaveBeenCalledTimes(0)
	})

	it('defaults to inputFormat when not specified any other way', () => {
		buildOutputFormatter<SimpleType>(command, ioUtil.IOFormat.YAML)

		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(0)
		expect(yamlFormatterSpy).toHaveBeenCalledTimes(1)

		jest.resetAllMocks()

		buildOutputFormatter<SimpleType>(command, ioUtil.IOFormat.JSON)

		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(0)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
	})

	it('falls back on JSON when unspecified and there is no common formatter', () => {
		buildOutputFormatter<SimpleType>(command)

		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(0)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
	})

	it('defaults to indent of 2 for yaml', () => {
		command.flags.yaml = true

		buildOutputFormatter<SimpleType>(command)

		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(0)
		expect(yamlFormatterSpy).toHaveBeenCalledTimes(1)
		expect(yamlFormatterSpy).toHaveBeenCalledWith(2)
	})

	it('defaults to indent of 4 for json', () => {
		buildOutputFormatter<SimpleType>(command)

		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(0)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
		expect(jsonFormatterSpy).toHaveBeenCalledWith(4)
	})

	it('accepts indent from config file over default', () => {
		command.profileConfig.indent = 7

		buildOutputFormatter<SimpleType>(command)

		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(0)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
		expect(jsonFormatterSpy).toHaveBeenCalledWith(7)
	})

	it('accepts indent from command line over config file and default', () => {
		command.profileConfig.indent = 7
		command.flags.indent = 13
		command.flags.yaml = true

		buildOutputFormatter<SimpleType>(command)

		expect(formatFromFilenameSpy).toHaveBeenCalledTimes(0)
		expect(yamlFormatterSpy).toHaveBeenCalledTimes(1)
		expect(yamlFormatterSpy).toHaveBeenCalledWith(13)
	})

	it('uses common formatter when present and no other specified', () => {
		const commonFormatter = jest.fn()
		const result = buildOutputFormatter<SimpleType>(command, undefined, commonFormatter)
		expect(result).toBe(commonFormatter)
	})
})
