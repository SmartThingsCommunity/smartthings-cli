import { jest } from '@jest/globals'

import type { Argv } from 'yargs'

import {
	userAgent,
	type APICommandFlags,
	type apiCommand,
	type apiDocsURL,
	type itemInputHelpText,
} from '../../lib/command/api-command.js'
import { buildArgvMockStub, type BuilderFunctionMock } from './builder-mock.js'


export const apiCommandMocks = <T extends APICommandFlags = APICommandFlags>(prefix: string): {
	apiDocsURLMock: jest.Mock<typeof apiDocsURL>
	itemInputHelpTextMock: jest.Mock<typeof itemInputHelpText>
	apiCommandMock: jest.Mock<typeof apiCommand>
	apiCommandBuilderMock: BuilderFunctionMock<Argv<T>>
} => {
	const apiDocsURLMock = jest.fn<typeof apiDocsURL>()
	const itemInputHelpTextMock = jest.fn<typeof itemInputHelpText>()
	const apiCommandBuilderMock = buildArgvMockStub<T>()
	const apiCommandMock = jest.fn<typeof apiCommand>()
	jest.unstable_mockModule(`${prefix}/lib/command/api-command.js`, () => ({
		userAgent,
		apiDocsURL: apiDocsURLMock,
		itemInputHelpText: itemInputHelpTextMock,
		apiCommandBuilder: apiCommandBuilderMock,
		apiCommand: apiCommandMock,
	}))

	return {
		apiDocsURLMock,
		itemInputHelpTextMock,
		apiCommandBuilderMock,
		apiCommandMock,
	}
}
