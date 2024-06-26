import { STATE_SYMBOL } from '../../../constants.js';
import { effect } from '../../../reactivity/effects.js';
import { untrack } from '../../../runtime.js';

/**
 * @param {any} bound_value
 * @param {Element} element_or_component
 * @returns {boolean}
 */
function is_bound_this(bound_value, element_or_component) {
	// Find the original target if the value is proxied.
	var proxy_target = bound_value && bound_value[STATE_SYMBOL]?.t;
	return bound_value === element_or_component || proxy_target === element_or_component;
}

/**
 * @param {Element} element_or_component
 * @param {(value: unknown, ...parts: unknown[]) => void} update
 * @param {(...parts: unknown[]) => unknown} get_value
 * @param {() => unknown[]} [get_parts] Set if the this binding is used inside an each block,
 * 										returns all the parts of the each block context that are used in the expression
 * @returns {void}
 */
export function bind_this(element_or_component, update, get_value, get_parts) {
	/** @type {unknown[]} */
	var old_parts;

	/** @type {unknown[]} */
	var parts;

	var e = effect(() => {
		old_parts = parts;
		// We only track changes to the parts, not the value itself to avoid unnecessary reruns.
		parts = get_parts?.() || [];

		untrack(() => {
			if (element_or_component !== get_value(...parts)) {
				update(element_or_component, ...parts);
				// If this is an effect rerun (cause: each block context changes), then nullfiy the binding at
				// the previous position if it isn't already taken over by a different effect.
				if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
					update(null, ...old_parts);
				}
			}
		});
	});

	// Add effect teardown (likely causes: if block became false, each item removed, component unmounted).
	// In these cases we need to nullify the binding only if we detect that the value is still the same.
	// If not, that means that another effect has now taken over the binding.
	e.ondestroy = () => {
		// Defer to the next tick so that all updates can be reconciled first.
		// This solves the case where one variable is shared across multiple this-bindings.
		effect(() => {
			if (parts && is_bound_this(get_value(...parts), element_or_component)) {
				update(null, ...parts);
			}
		});
	};
}
