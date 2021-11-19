
const defaultDebounceTime = 100
export function debounce(func, wait = defaultDebounceTime, immediate) {
	let timeout
	return function() {
		let context = this,
			args = arguments
		let later = function() {
			timeout = null
			if (!immediate) {
				func.apply(context, args)
			}
		}
		let callNow = immediate && !timeout
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
		if (callNow) {
			func.apply(context, args)
		}

		return timeout
	}
}

const defaultThrottleTime = 100
export function throttle(callback, delay = defaultThrottleTime, preventDefault = true) {
	let throttleTimeout = null;
	let storedEvent = null;

	const throttledEventHandler = (event) => {
		if (preventDefault) event.preventDefault()

		storedEvent = event;

		const shouldHandleEvent = !throttleTimeout;

		if (shouldHandleEvent) {
			callback(storedEvent);

			storedEvent = null;

			throttleTimeout = setTimeout(() => {
				throttleTimeout = null;

				if (storedEvent) {
					throttledEventHandler(storedEvent);
				}
			}, delay);
		}
	};

	throttledEventHandler.applyLastEvent = (lastEvent) => {
		clearTimeout(throttleTimeout)
		if (storedEvent) throttledEventHandler(lastEvent)

		storedEvent = null
	}

	return throttledEventHandler;
}