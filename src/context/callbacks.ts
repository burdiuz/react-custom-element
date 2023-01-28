import { useCallback, useState } from "react";
import { CallbackAddFn, CallbackMap, CallbackRemoveFn } from "./context";

export const useProvideCallbacks = <T>(): [
  CallbackMap<T>,
  CallbackAddFn<T>,
  CallbackRemoveFn<T>
] => {
  const [callbacks] = useState<CallbackMap<T>>(new Map());

  const add = useCallback(
    (name: string, callback: T) => {
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
    (name: string, callback: T) => {
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
