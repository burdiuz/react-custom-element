import { createContext, useContext } from "react";
import { Method, MethodImpl } from "./methods";

export type CallbackMap<T = () => void> = Map<string, Set<T>>;
export type CallbackAddFn<T = () => void> = (name: string, callback: T) => void;
export type CallbackRemoveFn<T = () => void> = (
  name: string,
  callback: T
) => void;

export type LifecycleAttributeChangedCallback = (
  // attribute changed callback
  element: HTMLElement,
  name: string,
  oldValue: string | undefined,
  newValue: string | undefined
) => void;

export type LifecycleCallback =
  | ((element: HTMLElement) => void)
  | LifecycleAttributeChangedCallback;

export type AttributeCallback = (
  name: string,
  oldValue: string | undefined,
  newValue: string | undefined
) => void;

export type ProviderValue = {
  container: HTMLElement;
  lifecycleCallbacks: CallbackMap<LifecycleCallback>;
  addLifecycleCallback: CallbackAddFn<LifecycleCallback>;
  removeLifecycleCallback: CallbackRemoveFn<LifecycleCallback>;
  attributeCallbacks: CallbackMap<AttributeCallback>;
  addAttributeCallback: CallbackAddFn<AttributeCallback>;
  removeAttributeCallback: CallbackRemoveFn<AttributeCallback>;
  getContainerCustomMethod: (name: string) => Method | undefined;
  hasContainerCustomMethod: (name: string) => boolean;
  setContainerCustomMethod: (name: string, impl: MethodImpl) => Method;
};

export const CustomElementContext = createContext<ProviderValue | undefined>(
  undefined
);

export const { Consumer: CustomElementConsumer } = CustomElementContext;

// export const useCustomElement = () => useContext(CustomElementContext);

export const useCustomElement = () => {
  const context = useContext(CustomElementContext);

  if (!context) {
    throw new Error(
      "CustomElement Context was not initialized, Provider is not present."
    );
  }

  return context;
};

export const useContainer = () => useCustomElement()?.container;
