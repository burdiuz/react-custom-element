import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AttributeCallback, useCustomElement } from "./context";

export const useContainerAttribute = (
  attributeName: string,
  callback: AttributeCallback
): [() => string | null, (value: string | null) => void] => {
  const callbackRef: MutableRefObject<{
    wrapper: AttributeCallback;
    callback: AttributeCallback;
  }> = useRef({
    wrapper: (...args) => callbackRef.current?.callback(...args),
    callback,
  });

  callbackRef.current.callback = callback;

  const { container, addAttributeCallback, removeAttributeCallback } =
    useCustomElement();

  useEffect(() => {
    addAttributeCallback(attributeName, callbackRef.current.wrapper);

    return () => {
      removeAttributeCallback(attributeName, callbackRef.current.wrapper);
    };
  }, [attributeName, addAttributeCallback, removeAttributeCallback]);

  const read = useCallback(
    () => container.getAttribute(attributeName),
    [container, attributeName]
  );

  const update = useCallback(
    (value: string | null) => {
      if (value === null) {
        container.removeAttribute(attributeName);
        return;
      }

      container.setAttribute(attributeName, value);
    },
    [container, attributeName]
  );

  return [read, update];
};

/**
 *  Tracks changes for multiple container HTML element attributes.
 * @param attributeNames - A list of attributes to listen for updates. It is memoized on initial render and cannot be updated.
 * @returns Object with values for selected attributes.
 */
export const useContainerAttributes = (
  attributeNames: string[]
): [
  Partial<{ [K in typeof attributeNames[number]]: string | null }>,
  (
    values: Partial<{ [K in typeof attributeNames[number]]: string | null }>
  ) => void,
  () => Partial<{ [K in typeof attributeNames[number]]: string | null }>
] => {
  type Attributes = typeof attributeNames[number];
  type AttributeValues = {
    [K in Attributes]: string | null;
  };
  const [values, setValues] = useState<Partial<AttributeValues>>({});
  const { container, addAttributeCallback, removeAttributeCallback } =
    useCustomElement();

  const read = useCallback(
    () =>
      attributeNames.reduce<Partial<AttributeValues>>((res, name) => {
        const value = container.getAttribute(name);

        if (value === null) {
          return res;
        }

        return { ...res, [name]: value };
      }, {}),
    [container]
  );

  const update = useCallback(
    (values: Partial<AttributeValues>) =>
      attributeNames.forEach((name) => {
        if (name in values) {
          const value = values[name];

          if (value === undefined) {
            return;
          }

          if (value === null) {
            container.removeAttribute(name);
            return;
          }

          container.setAttribute(name, value);
        }
      }),
    [container]
  );

  useEffect(() => {
    const callback = (
      name: Attributes,
      _: string | undefined,
      newValue: string | undefined
    ) =>
      setValues((state) => {
        if (newValue !== undefined) {
          return { ...state, [name]: newValue };
        }

        const newState = { ...state };
        delete newState[name];
        return newState;
      });

    /**
     * Might verify nes list of names or new values for equality
     * and abort early of its same set of names or same values returned.
     */

    attributeNames.forEach((name) => addAttributeCallback(name, callback));
    setValues(read());

    return () => {
      attributeNames.forEach((name) => removeAttributeCallback(name, callback));
    };
  }, [read, addAttributeCallback, removeAttributeCallback]);

  return [values, update, read];
};
