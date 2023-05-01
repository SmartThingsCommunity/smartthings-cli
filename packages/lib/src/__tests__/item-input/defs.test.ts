import {
	addAction,
	addOption,
	deleteAction,
	deleteOption,
	editAction,
	editOption,
	finishAction,
	finishOption,
} from '../../item-input/defs'


test('addOption', () => {
	expect(addOption('Thing')).toStrictEqual({ name: 'Add Thing.', value: addAction })
})

test('editAction', () => {
	expect(editOption('Thing')).toStrictEqual({ name: 'Edit Thing.', value: editAction })
})

test('deleteOption', () => {
	expect(deleteOption('Thing')).toStrictEqual({ name: 'Delete Thing.', value: deleteAction })
})

test('finishOption', () => {
	expect(finishOption('Thing')).toStrictEqual({ name: 'Finish editing Thing.', value: finishAction })
})
