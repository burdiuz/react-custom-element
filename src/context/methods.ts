import { useCallback, useEffect } from "react";
import { useCustomElement } from "./context";

const methodImplProp = Symbol("method-implementation");

export type MethodImpl = (this: object, ...args: unknown[]) => unknown | void;

export interface Method {
  (this: object, ...args: unknown[]): unknown | void;
  [methodImplProp]?: MethodImpl;
}

export const useInstanceMethods = (instance: any) => {
  const get = useCallback(
    (name: string) => {
      let method = instance[name] as Method;

      if (method?.[methodImplProp]) {
        return method[methodImplProp];
      }
    },
    [instance]
  );

  const has = useCallback(
    (name: string) => !!(instance[name] as Method)?.[methodImplProp],
    [instance]
  );

  const set = useCallback(
    (name: string, impl: MethodImpl) => {
      let method = instance[name] as Method;

      if (method?.[methodImplProp]) {
        method[methodImplProp] = impl;
        return method;
      }

      method = function ReactCustomElementMethod(...args: unknown[]) {
        return method?.[methodImplProp]?.apply(this, args);
      };

      method[methodImplProp] = impl;
      instance[name] = method;
      return method;
    },
    [instance]
  );

  return { has, get, set };
};

export const useSetContainerCustomMethod = (
  name: string,
  methodFn: MethodImpl
) => {
  const { setContainerCustomMethod } = useCustomElement();

  /**
   * This should be called before onMount events because custom element 
   * provider is a parent component to any component where this can be used.
   * Provider runs onMount un useEffect hook and useEffect hooks run first
   * in child components.
   */
  useEffect(() => {
    setContainerCustomMethod(name, methodFn);
  }, [name, methodFn, setContainerCustomMethod]);
};
