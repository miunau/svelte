import { pre_effect, user_root_effect } from '../internal/client/reactivity/effects.js';
import { flushSync } from '../main/main-client.js';
import { ReactiveSet } from './set.js';
import { assert, test } from 'vitest';

test('set.values()', () => {
	const set = new ReactiveSet([1, 2, 3, 4, 5]);

	const log: any = [];

	const cleanup = user_root_effect(() => {
		pre_effect(() => {
			log.push(set.size);
		});

		pre_effect(() => {
			log.push(set.has(3));
		});

		pre_effect(() => {
			log.push(Array.from(set));
		});
	});

	flushSync(() => {
		set.delete(3);
	});

	flushSync(() => {
		set.clear();
	});

	assert.deepEqual(log, [5, true, [1, 2, 3, 4, 5], 4, false, [1, 2, 4, 5], 0, [], false]); // TODO update when we fix effect ordering bug

	cleanup();
});

test('set.has(...)', () => {
	const set = new ReactiveSet([1, 2, 3]);

	const log: any = [];

	const cleanup = user_root_effect(() => {
		pre_effect(() => {
			log.push('has 1', set.has(1));
		});

		pre_effect(() => {
			log.push('has 2', set.has(2));
		});

		pre_effect(() => {
			log.push('has 3', set.has(3));
		});
	});

	flushSync(() => {
		set.delete(2);
	});

	flushSync(() => {
		set.add(2);
	});

	assert.deepEqual(log, [
		'has 1',
		true,
		'has 2',
		true,
		'has 3',
		true,
		'has 2',
		false,
		'has 2',
		true
	]);

	cleanup();
});
