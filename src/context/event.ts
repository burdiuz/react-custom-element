import { useCallback, useEffect } from "react";
import { useContainer } from "./context";

export const useContainerDispatch = (eventName: string) => {
  const container = useContainer();

  return useCallback(
    (detail: unknown) => {
      const event = new CustomEvent(eventName, { detail });
      container.dispatchEvent(event);
    },
    [container, eventName]
  );
};

/**
 * Does not memoize event listener, so if not memoized listener is used, will re-subscribe listener on every render.
 */
const useContainerListenerFn = (
  eventName: string,
  listener: (event: Event) => void,
  useCapture: boolean
) => {
  const container = useContainer();

  useEffect(() => {
    container.addEventListener(eventName, listener, useCapture);

    return () => {
      container.removeEventListener(eventName, listener, useCapture);
    };
  }, [container, eventName, listener, useCapture]);
};

export const useContainerListener = (
  eventName: string,
  listener: (event: Event) => void,
  useCapture: boolean,
  dependencies: unknown[]
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const listenerFn = useCallback(listener, dependencies);

  return useContainerListenerFn(eventName, listenerFn, useCapture);
};
