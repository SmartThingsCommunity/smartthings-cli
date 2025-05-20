import { jest } from '@jest/globals'

import type { InputDefinition } from '../../lib/item-input/defs.js'


export type InputDefinitionFunctionMockSet<T> = {
	buildFromUserInput: jest.Mock<InputDefinition<T>['buildFromUserInput']>
	summarizeForEdit: jest.Mock<InputDefinition<T>['summarizeForEdit']>
	updateFromUserInput: jest.Mock<InputDefinition<T>['updateFromUserInput']>
	updateIfNeeded?: jest.Mock<Required<InputDefinition<T>>['updateIfNeeded']>
	validateFinal?: jest.Mock<Required<InputDefinition<T>>['validateFinal']>
}
export type MockedInputDefinition<T> = InputDefinition<T> & {
	// A copy of the function mocks, typed as `jest.Mock` for mocking and using with `expect`.
	mocks: InputDefinitionFunctionMockSet<T>
}

export type BuildInputDefMockOptions = {
	includeUpdateIfNeeded?: boolean
	itemTypeData?: { type: 'object' }
	includeValidateFinal?: boolean
}
export const buildInputDefMock = <T>(
	name: string,
	options?: BuildInputDefMockOptions,
): MockedInputDefinition<T> => {
	const inputBuildFromUserInputMock = jest.fn<InputDefinition<T>['buildFromUserInput']>()
	const inputSummarizeForEditMock = jest.fn<InputDefinition<T>['summarizeForEdit']>()
	const inputUpdateFromUserInputMock = jest.fn<InputDefinition<T>['updateFromUserInput']>()

	const mocks: InputDefinitionFunctionMockSet<T> = {
		buildFromUserInput: inputBuildFromUserInputMock,
		summarizeForEdit: inputSummarizeForEditMock,
		updateFromUserInput: inputUpdateFromUserInputMock,
	}
	if (options?.includeUpdateIfNeeded) {
		mocks.updateIfNeeded = jest.fn<Required<InputDefinition<T>>['updateIfNeeded']>()
	}
	if (options?.includeValidateFinal) {
		mocks.validateFinal = jest.fn<Required<InputDefinition<T>>['validateFinal']>()
	}

	const retVal: MockedInputDefinition<T> = {
		...mocks,
		name,
		mocks,
	}

	if (options?.itemTypeData) {
		retVal.itemTypeData = options.itemTypeData
	}

	return retVal
}
