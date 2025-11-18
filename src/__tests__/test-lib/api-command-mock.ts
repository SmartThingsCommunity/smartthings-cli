import { jest } from '@jest/globals'

import type { Argv } from 'yargs'

import {
	userAgent,
	type APICommandFlags,
	type apiCommand,
} from '../../lib/command/api-command.js'
import { buildArgvMockStub, type BuilderFunctionMock } from './builder-mock.js'


export const apiCommandMocks = <T extends APICommandFlags = APICommandFlags>(prefix: string): {
	apiCommandMock: jest.Mock<typeof apiCommand>
	apiCommandBuilderMock: BuilderFunctionMock<Argv<T>>
} => {
	const apiCommandBuilderMock = buildArgvMockStub<T>()
	const apiCommandMock = jest.fn<typeof apiCommand>()
	jest.unstable_mockModule(`${prefix}/lib/command/api-command.js`, () => ({
		userAgent,
		apiCommandBuilder: apiCommandBuilderMock,
		apiCommand: apiCommandMock,
	}))

	return {
		apiCommandBuilderMock,
		apiCommandMock,
	}
}
