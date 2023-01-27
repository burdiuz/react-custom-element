import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const CustomElementContext = createContext({
  container: null,
});

export const { Consumer: CustomElementConsumer } = CustomElementContext;

export const CallbackNames = {
  // Might not be interceptable by react part since rendering usually occurs after element is attached
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ADOPTED: "adopted",
  ATTRIBUTE_CHANGED: "attributeChanged",
};

export const useCustomElement = () => useContext(CustomElementContext);

export const useContainer = () => useCustomElement().container;

/*
 * ---------------------------- Lifecycle Callbacks
 */

/**
 * Does not memoize event listener, so if not memoized listener is used, will re-subscribe listener on every render.
 */
const useContainerLifecycleFn = (callbackName, callback) => {
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

export const useContainerLifecycle = (callbackName, callback, dependencies) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callbackFn = useCallback(callback, dependencies);

  return useContainerLifecycleFn(callbackName, callbackFn);
};

/*
 * ---------------------------- Event Listeners
 */

export const useContainerDispatch = (eventName) => {
  const container = useContainer();

  return useCallback(
    (detail) => {
      const event = new CustomEvent(eventName, { detail });
      console.log("DISPATCH:", container, event);
      container.dispatchEvent(event);
    },
    [container, eventName]
  );
};

/**
 * Does not memoize event listener, so if not memoized listener is used, will re-subscribe listener on every render.
 */
const useContainerListenerFn = (eventName, listener, useCapture) => {
  const container = useContainer();

  useEffect(() => {
    container.addEventListener(eventName, listener, useCapture);

    return () => {
      container.removeEventListener(eventName, listener, useCapture);
    };
  }, [container, eventName, listener, useCapture]);
};

export const useContainerListener = (
  eventName,
  listener,
  useCapture,
  dependencies
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const listenerFn = useCallback(listener, dependencies);

  return useContainerListenerFn(eventName, listenerFn, useCapture);
};

/*
 * ---------------------------- Container Attributes
 */

/**
 * Does not memoize attribute callback, so if not memoized callback is used, will re-subscribe callback on every render.
 */
const useContainerAttributeFn = (attributeName, callback) => {
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

  const read = useCallback(() => {
    console.log(container);
    return container.getAttribute(attributeName);
  }, [container, attributeName]);

  const update = useCallback(
    (value) => container.setAttribute(attributeName, value),
    [container, attributeName]
  );

  return [read, update];
};

export const useContainerAttribute = (
  attributeName,
  callback,
  dependencies
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callbackFn = useCallback(callback, dependencies);

  return useContainerAttributeFn(attributeName, callbackFn);
};

/*
 * ---------------------------- Container Definition
 */

const useProvideCallbacks = () => {
  const [callbacks] = useState(new Map());

  const add = useCallback(
    (name, callback) => {
      /**
       * @var Set
       */
      let namedCallbacks = callbacks.get(name);
      if (!namedCallbacks) {
        namedCallbacks = new Set();
        callbacks.set(name, namedCallbacks);
      }

      namedCallbacks.add(callback);
    },
    [callbacks]
  );

  const remove = useCallback(
    (name, callback) => {
      let namedCallbacks = callbacks.get(name);

      if (!namedCallbacks) {
        return;
      }

      namedCallbacks.delete(callback);
    },
    [callbacks]
  );

  return [callbacks, add, remove];
};

export const CustomElementProvider = ({
  container,
  onMount,
  onUnmount,
  children,
}) => {
  const [lifecycleCallbacks, addLifecycleCallback, removeLifecycleCallback] =
    useProvideCallbacks();

  const [attributeCallbacks, addAttributeCallback, removeAttributeCallback] =
    useProvideCallbacks();

  useEffect(() => {
    if (onMount) {
      onMount({ lifecycleCallbacks, attributeCallbacks });
    }

    return () => {
      onUnmount && onUnmount({ lifecycleCallbacks, attributeCallbacks });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      container,
      lifecycleCallbacks,
      addLifecycleCallback,
      removeLifecycleCallback,
      attributeCallbacks,
      addAttributeCallback,
      removeAttributeCallback,
    }),
    [
      container,
      lifecycleCallbacks,
      addLifecycleCallback,
      removeLifecycleCallback,
      attributeCallbacks,
      addAttributeCallback,
      removeAttributeCallback,
    ]
  );

  return (
    <CustomElementContext.Provider value={value}>
      {children}
    </CustomElementContext.Provider>
  );
};
