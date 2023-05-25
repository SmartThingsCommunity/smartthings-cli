import { IOFormat } from '../io-util.js'
import * as output from '../output.js'
import { buildOutputFormatter } from '../output-builder.js'

import { buildMockCommand } from './test-lib/mock-command.js'
import { SimpleType } from './test-lib/simple-type.js'


describe('buildOutputFormatter', () => {
	const command = buildMockCommand()
	const calculateOutputFormatSpy = jest.spyOn(output, 'calculateOutputFormat')
	const jsonFormatter = jest.fn()
	const jsonFormatterSpy = jest.spyOn(output, 'jsonFormatter').mockReturnValue(jsonFormatter)
	const yamlFormatter = jest.fn()
	const yamlFormatterSpy = jest.spyOn(output, 'yamlFormatter').mockReturnValue(yamlFormatter)

	it('uses commonOutputFormatter when it exists', () => {
		calculateOutputFormatSpy.mockReturnValue(IOFormat.COMMON)
		const commonFormatter = jest.fn()

		expect(buildOutputFormatter<SimpleType>(command, undefined, commonFormatter)).toBe(commonFormatter)

		expect(calculateOutputFormatSpy).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatSpy).toHaveBeenCalledWith(command, undefined)
	})

	it('uses yamlFormatter with default of 2 for YAML output', () => {
		calculateOutputFormatSpy.mockReturnValue(IOFormat.YAML)

		buildOutputFormatter<SimpleType>(command)

		expect(calculateOutputFormatSpy).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatSpy).toHaveBeenCalledWith(command, undefined)
		expect(yamlFormatterSpy).toHaveBeenCalledTimes(1)
		expect(yamlFormatterSpy).toHaveBeenCalledWith(2)
	})

	it('uses jsonFormatter with a default of 4 for JSON output', () => {
		calculateOutputFormatSpy.mockReturnValue(IOFormat.COMMON)

		expect(buildOutputFormatter<SimpleType>(command)).toBe(jsonFormatter)

		expect(calculateOutputFormatSpy).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatSpy).toHaveBeenCalledWith(command, undefined)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
		expect(jsonFormatterSpy).toHaveBeenCalledWith(4)
	})

	it('accepts indent from config file over default', () => {
		calculateOutputFormatSpy.mockReturnValue(IOFormat.JSON)
		command.cliConfig.profile.indent = 7

		buildOutputFormatter<SimpleType>(command)

		expect(calculateOutputFormatSpy).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatSpy).toHaveBeenCalledWith(command, undefined)
		expect(jsonFormatterSpy).toHaveBeenCalledTimes(1)
		expect(jsonFormatterSpy).toHaveBeenCalledWith(7)
	})

	it('accepts indent from command line over config file and default', () => {
		calculateOutputFormatSpy.mockReturnValue(IOFormat.YAML)
		command.cliConfig.profile.indent = 7
		command.flags.indent = 13

		buildOutputFormatter<SimpleType>(command)

		expect(calculateOutputFormatSpy).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatSpy).toHaveBeenCalledWith(command, undefined)
		expect(yamlFormatterSpy).toHaveBeenCalledTimes(1)
		expect(yamlFormatterSpy).toHaveBeenCalledWith(13)
	})
})
