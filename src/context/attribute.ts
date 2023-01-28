import { useCallback, useEffect } from "react";
import { AttributeCallback, useCustomElement } from "./context";

/**
 * Does not memoize attribute callback, so if not memoized callback is used, will re-subscribe callback on every render.
 */
const useContainerAttributeFn = (
  attributeName: string,
  callback: AttributeCallback
) => {
  const { container, addAttributeCallback, removeAttributeCallback } =
    useCustomElement();

  useEffect(() => {
    if (callback) {
      addAttributeCallback(attributeName, callback);
    }

    return () => {
      if (callback) {
        removeAttributeCallback(attributeName, callback);
      }
    };
  }, [attributeName, callback, addAttributeCallback, removeAttributeCallback]);

  const read = useCallback(
    () => container.getAttribute(attributeName),
    [container, attributeName]
  );

  const update = useCallback(
    (value: unknown) => container.setAttribute(attributeName, String(value)),
    [container, attributeName]
  );

  return [read, update];
};

export const useContainerAttribute = (
  attributeName: string,
  callback: AttributeCallback,
  dependencies: unknown[]
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callbackFn = useCallback(callback, dependencies);

  return useContainerAttributeFn(attributeName, callbackFn);
};
