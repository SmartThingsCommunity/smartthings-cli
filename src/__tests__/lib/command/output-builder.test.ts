import { jest } from '@jest/globals'

import {
	OutputFormatter,
	calculateOutputFormat,
	calculateOutputFormatBuilder,
	jsonFormatter,
	yamlFormatter,
} from '../../../lib/command/output.js'
import { BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'
import { SimpleType } from '../../test-lib/simple-type.js'
import { CLIConfig } from '../../../lib/cli-config.js'
import { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const calculateOutputFormatMock = jest.fn<typeof calculateOutputFormat>()
const calculateOutputFormatBuilderMock = jest.fn<typeof calculateOutputFormatBuilder>()
const jsonFormatterMock = jest.fn<typeof jsonFormatter<SimpleType>>()
const yamlFormatterMock = jest.fn<typeof yamlFormatter<SimpleType>>()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	calculateOutputFormat: calculateOutputFormatMock,
	calculateOutputFormatBuilder: calculateOutputFormatBuilderMock,
	jsonFormatter: jsonFormatterMock,
	yamlFormatter: yamlFormatterMock,
}))


const { buildOutputFormatter, buildOutputFormatterBuilder } = await import('../../../lib/command/output-builder.js')


test('buildOutputFormatterBuilder', () => {
	const {
		yargsMock,
		optionMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	calculateOutputFormatBuilderMock.mockReturnValue(argvMock)

	expect(buildOutputFormatterBuilder(yargsMock)).toBe(argvMock)

	expect(calculateOutputFormatBuilderMock).toHaveBeenCalledTimes(1)
	expect(calculateOutputFormatBuilderMock).toHaveBeenCalledWith(yargsMock)
	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(optionMock).toHaveBeenCalledWith('indent', expect.objectContaining({ type: 'number' }))
	expect(optionMock).toHaveBeenCalledWith('group-rows', expect.objectContaining({ type: 'boolean' }))
})

describe('buildOutputFormatter', () => {
	const jsonOutputFormatter = jest.fn<OutputFormatter<SimpleType>>()
	jsonFormatterMock.mockReturnValue(jsonOutputFormatter)
	const yamlOutputFormatter = jest.fn<OutputFormatter<SimpleType>>()
	yamlFormatterMock.mockReturnValue(yamlOutputFormatter)

	const flags = { output: 'output.yaml' } as BuildOutputFormatterFlags
	const cliConfig = {
		profile: {},
	} as CLIConfig

	it('uses commonOutputFormatter when it exists', () => {
		calculateOutputFormatMock.mockReturnValue('common')
		const commonFormatter = jest.fn<OutputFormatter<SimpleType>>()

		expect(buildOutputFormatter<SimpleType>(flags, cliConfig, undefined, commonFormatter)).toBe(commonFormatter)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
	})

	it('uses yamlFormatter with default of 2 for YAML output', () => {
		calculateOutputFormatMock.mockReturnValue('yaml')

		buildOutputFormatter<SimpleType>(flags, cliConfig)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(yamlFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlFormatterMock).toHaveBeenCalledWith(2)
	})

	it('uses jsonFormatter with a default of 4 for JSON output', () => {
		calculateOutputFormatMock.mockReturnValue('common')

		expect(buildOutputFormatter<SimpleType>(flags, cliConfig)).toBe(jsonOutputFormatter)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonFormatterMock).toHaveBeenCalledWith(4)
	})

	it('accepts indent from config file over default', () => {
		calculateOutputFormatMock.mockReturnValue('json')

		const cliConfig = { profile: { indent: 7 } } as unknown as CLIConfig
		buildOutputFormatter<SimpleType>(flags, cliConfig)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonFormatterMock).toHaveBeenCalledWith(7)
	})

	it('accepts indent from command line over config file and default', () => {
		calculateOutputFormatMock.mockReturnValue('yaml')

		const flags = { indent: 13 } as unknown as SmartThingsCommandFlags
		const cliConfig = { profile: { indent: 13 } } as unknown as CLIConfig
		buildOutputFormatter<SimpleType>(flags, cliConfig)

		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledWith(flags, undefined)
		expect(yamlFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlFormatterMock).toHaveBeenCalledWith(13)
	})
})
