import yargs, { Argv } from 'yargs'

import { IOFormat } from '../../../lib/io-util.js'
import { CalculateOutputFormatFlags, calculateOutputFormat, calculateOutputFormatBuilder, jsonFormatter, yamlFormatter } from '../../../lib/command/output.js'
import { BuildOutputFormatterFlags, buildOutputFormatter, buildOutputFormatterBuilder } from '../../../lib/command/output-builder.js'
import { SimpleType } from '../../test-lib/simple-type.js'
import { CLIConfig } from '../../../lib/cli-config.js'
import { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'


jest.mock('../../../lib/command/output.js')

test('buildOutputFormatterBuilder', () => {
	const calculateOutputFormatArgvMock = jest.fn() as unknown as Argv<CalculateOutputFormatFlags>
	const optionMock = jest.fn().mockReturnValue(calculateOutputFormatArgvMock)
	calculateOutputFormatArgvMock.option = optionMock
	const parsed = { parsed: 'values' }
	const parseMock = jest.fn().mockResolvedValue(parsed)
	calculateOutputFormatArgvMock.parse = parseMock
	const calculateOutputFormatBuilderMock = jest.mocked(calculateOutputFormatBuilder)
		.mockReturnValue(calculateOutputFormatArgvMock)
	const input: Argv<SmartThingsCommandFlags & { testOption?: string }> = yargs
		.option('profile', { type: 'string', default: 'default' })

	expect(buildOutputFormatterBuilder(input)).toBe(calculateOutputFormatArgvMock)

	expect(calculateOutputFormatBuilderMock).toHaveBeenCalledTimes(1)
	expect(calculateOutputFormatBuilderMock).toHaveBeenCalledWith(input)
	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(optionMock).toHaveBeenCalledWith('indent', expect.objectContaining({ type: 'number' }))
	expect(optionMock).toHaveBeenCalledWith('group-rows', expect.objectContaining({ type: 'boolean' }))
})

describe('buildOutputFormatter', () => {
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat)
	const jsonOutputFormatter = jest.fn()
	const jsonFormatterMock = jest.mocked(jsonFormatter).mockReturnValue(jsonOutputFormatter)
	const yamlOutputFormatter = jest.fn()
	const yamlFormatterMock = jest. mocked(yamlFormatter).mockReturnValue(yamlOutputFormatter)

	const flags = { output: 'output.yaml' } as BuildOutputFormatterFlags
	const cliConfig = {
		profile: {},
	} as CLIConfig

	it('uses commonOutputFormatter when it exists', () => {
		calculateOutputFormatMock.mockReturnValue(IOFormat.COMMON)
		const commonFormatter = jest.fn()

		expect(buildOutputFormatter<SimpleType>(flags, cliConfig, undefined, commonFormatter)).toBe(commonFormatter)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
	})

	it('uses yamlFormatter with default of 2 for YAML output', () => {
		calculateOutputFormatMock.mockReturnValue(IOFormat.YAML)

		buildOutputFormatter<SimpleType>(flags, cliConfig)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(yamlFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlFormatterMock).toHaveBeenCalledWith(2)
	})

	it('uses jsonFormatter with a default of 4 for JSON output', () => {
		calculateOutputFormatMock.mockReturnValue(IOFormat.COMMON)

		expect(buildOutputFormatter<SimpleType>(flags, cliConfig)).toBe(jsonOutputFormatter)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonFormatterMock).toHaveBeenCalledWith(4)
	})

	it('accepts indent from config file over default', () => {
		calculateOutputFormatMock.mockReturnValue(IOFormat.JSON)

		const cliConfig = { profile: { indent: 7 } } as unknown as CLIConfig
		buildOutputFormatter<SimpleType>(flags, cliConfig)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonFormatterMock).toHaveBeenCalledWith(7)
	})

	it('accepts indent from command line over config file and default', () => {
		calculateOutputFormatMock.mockReturnValue(IOFormat.YAML)

		const flags = { indent: 13 } as unknown as SmartThingsCommandFlags
		const cliConfig = { profile: { indent: 13 } } as unknown as CLIConfig
		buildOutputFormatter<SimpleType>(flags, cliConfig)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(yamlFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlFormatterMock).toHaveBeenCalledWith(13)
	})
})
