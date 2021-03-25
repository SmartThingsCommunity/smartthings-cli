import { Logger } from '@smartthings/core-sdk'


export const traceMock = jest.fn()
export const debugMock = jest.fn()
export const infoMock = jest.fn()
export const warnMock = jest.fn()
export const errorMock = jest.fn()
export const fatalMock = jest.fn()

export const isTraceEnabledMock = jest.fn()
export const isDebugEnabledMock = jest.fn()
export const isInfoEnabledMock = jest.fn()
export const isWarnEnabledMock = jest.fn()
export const isErrorEnabledMock = jest.fn()
export const isFatalEnabledMock = jest.fn()

export function buildMockLogger(level: string): Logger {
	return {
		level,

		trace: traceMock,
		debug: debugMock,
		info: infoMock,
		warn: warnMock,
		error: errorMock,
		fatal: fatalMock,

		isTraceEnabled: isTraceEnabledMock,
		isDebugEnabled: isDebugEnabledMock,
		isInfoEnabled: isInfoEnabledMock,
		isWarnEnabled: isWarnEnabledMock,
		isErrorEnabled: isErrorEnabledMock,
		isFatalEnabled: isFatalEnabledMock,
	}
}
