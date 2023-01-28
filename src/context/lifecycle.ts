import { useCallback, useEffect } from "react";
import { LifecycleCallback, useCustomElement } from "./context";

export const CallbackNames = {
  // Might not be interceptable by react part since rendering usually occurs after element is attached
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ADOPTED: "adopted",
  ATTRIBUTE_CHANGED: "attributeChanged",
} as const;

/**
 * Does not memoize event listener, so if not memoized listener is used, will re-subscribe listener on every render.
 */
const useContainerLifecycleFn = (
  callbackName: string,
  callback: LifecycleCallback
) => {
  const { addLifecycleCallback, removeLifecycleCallback } = useCustomElement();

  useEffect(() => {
    if (callback) {
      addLifecycleCallback(callbackName, callback);
    }

    return () => {
      if (callback) {
        removeLifecycleCallback(callbackName, callback);
      }
    };
  }, [callbackName, callback, addLifecycleCallback, removeLifecycleCallback]);
};

export const useContainerLifecycle = (
  callbackName: string,
  callback: LifecycleCallback,
  dependencies: unknown[]
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callbackFn = useCallback(callback, dependencies);

  return useContainerLifecycleFn(callbackName, callbackFn);
};
