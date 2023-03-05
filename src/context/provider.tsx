import React, { FC, useEffect, useMemo, ReactNode } from "react";
import { useProvideCallbacks } from "./callbacks";
import {
  AttributeCallback,
  CallbackMap,
  CustomElementContext,
  LifecycleCallback,
} from "./context";
import { useInstanceMethods } from "./methods";

export type ProviderInitCallbackParams = {
  lifecycleCallbacks: CallbackMap<LifecycleCallback>;
  attributeCallbacks: CallbackMap<AttributeCallback>;
};

export type ProviderInitCallback = (params: ProviderInitCallbackParams) => void;

export const CustomElementProvider: FC<{
  container: HTMLElement;
  onMount?: ProviderInitCallback;
  onUnmount?: ProviderInitCallback;
  children: ReactNode;
}> = ({ container, onMount, onUnmount, children }) => {
  const [lifecycleCallbacks, addLifecycleCallback, removeLifecycleCallback] =
    useProvideCallbacks<LifecycleCallback>();

  const [attributeCallbacks, addAttributeCallback, removeAttributeCallback] =
    useProvideCallbacks<AttributeCallback>();

  useEffect(() => {
    onMount?.({ lifecycleCallbacks, attributeCallbacks });

    return () => {
      onUnmount?.({ lifecycleCallbacks, attributeCallbacks });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    get: getContainerCustomMethod,
    has: hasContainerCustomMethod,
    set: setContainerCustomMethod,
  } = useInstanceMethods(container);

  const value = useMemo(
    () => ({
      container,
      lifecycleCallbacks,
      addLifecycleCallback,
      removeLifecycleCallback,
      attributeCallbacks,
      addAttributeCallback,
      removeAttributeCallback,
      getContainerCustomMethod,
      hasContainerCustomMethod,
      setContainerCustomMethod,
    }),
    [
      container,
      lifecycleCallbacks,
      addLifecycleCallback,
      removeLifecycleCallback,
      attributeCallbacks,
      addAttributeCallback,
      removeAttributeCallback,
      getContainerCustomMethod,
      hasContainerCustomMethod,
      setContainerCustomMethod,
    ]
  );

  return (
    <CustomElementContext.Provider value={value}>
      {children}
    </CustomElementContext.Provider>
  );
};
