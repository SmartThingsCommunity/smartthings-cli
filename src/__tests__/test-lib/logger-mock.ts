import { jest } from '@jest/globals'

import type log4js from 'log4js'


export const configureMock: jest.Mock<typeof log4js.configure> = jest.fn()
export const getLoggerMock: jest.Mock<typeof log4js.getLogger> = jest.fn()
export const isDebugEnabledMock = jest.fn<log4js.Logger['isDebugEnabled']>()
export const errorMock = jest.fn<log4js.Logger['error']>()
export const warnMock = jest.fn<log4js.Logger['warn']>()
export const debugMock = jest.fn<log4js.Logger['debug']>()
export const traceMock = jest.fn<log4js.Logger['trace']>()
export const loggerMock = {
	isDebugEnabled: isDebugEnabledMock,
	error: errorMock,
	warn: warnMock,
	debug: debugMock,
	trace: traceMock,
} as unknown as log4js.Logger
getLoggerMock.mockReturnValue(loggerMock)
jest.unstable_mockModule('log4js', () => ({
	default: {
		configure: configureMock,
		getLogger: getLoggerMock,
	},
}))
