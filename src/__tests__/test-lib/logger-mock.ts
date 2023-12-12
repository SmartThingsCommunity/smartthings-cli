import { jest } from '@jest/globals'

import log4js from 'log4js'


export const configureMock: jest.Mock<typeof log4js.configure> = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LogFunction = (message: any, ...args: any[]) => void
export const getLoggerMock: jest.Mock<typeof log4js.getLogger> = jest.fn()
export const errorMock = jest.fn() as jest.Mock<LogFunction>
export const warnMock = jest.fn() as jest.Mock<LogFunction>
export const debugMock = jest.fn() as jest.Mock<LogFunction>
export const traceMock = jest.fn() as jest.Mock<LogFunction>
export const loggerMock = {
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
