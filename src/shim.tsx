import React, {
  memo,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  Ref,
  JSXElementConstructor,
  AllHTMLAttributes,
} from "react";
import { CustomHTMLElement } from "./element";

const isEventName = (name: string) => /^on[A-Z]/.test(name);

/*
 * Does not support Capture phase yet
 */
const handlerToEventName = (name: string) =>
  name.charAt(2).toLowerCase() + name.substring(3);

const filterEventProps = (
  all: Record<string, unknown>
): [Record<string, (event: Event) => void>, Record<string, unknown>] => {
  const props: Record<string, unknown> = {};
  const events: Record<string, (event: Event) => void> = {};

  Object.keys(all).forEach((name) => {
    if (isEventName(name) && typeof all[name] === "function") {
      events[name] = all[name] as () => void;
      return;
    }

    props[name] = all[name];
  });

  return [events, props];
};

interface MutableListener {
  (event: Event): void;
  callback: (event: Event) => void;
}

type ListenersHashMap = Record<string, MutableListener>;

const CustomElementShimInner = (
  {
    name: ChildComponent,
    ...shimProps
  }: {
    name: string | JSXElementConstructor<any>;
  } & (AllHTMLAttributes<HTMLElement> | Record<string, unknown>),
  outputRef: Ref<CustomHTMLElement | null>
) => {
  const events = useRef<ListenersHashMap>({});
  const element = useRef<CustomHTMLElement>(null);

  const [eventProps, props] = filterEventProps(shimProps);

  useImperativeHandle(outputRef, () => element.current);

  /**
   * This effect does not have dependencies and runs on every render.
   * It checks event handlers and updates listeners accordingly.
   * Latest event listeners are stored in "events" ref.
   * I've put this code into a hook just to have a block of code.
   */
  useEffect(() => {
    const prevEvents: ListenersHashMap = events.current;
    const newEvents: ListenersHashMap = {};

    Object.keys(eventProps).forEach((name) => {
      // if listener was not registered before, create new and add to element
      if (!prevEvents[name]) {
        const handler = function (this: unknown, event: Event) {
          handler.callback.call(this, event);
        };

        handler.callback = eventProps[name];
        newEvents[name] = handler;

        element.current?.addEventListener(handlerToEventName(name), handler);
        return;
      }

      // if listener was registered before, just update callback
      newEvents[name] = prevEvents[name];
      newEvents[name].callback = eventProps[name];
      // remove updated listener from previous listeners map
      delete prevEvents[name];
    });

    // remaining previous listeners weren't used this time, so should be removed
    Object.keys(prevEvents).forEach((name) => {
      element.current?.removeEventListener(
        handlerToEventName(name),
        prevEvents[name]
      );
    });

    events.current = newEvents;
  });

  return <ChildComponent ref={element} {...props} />;
};

export const CustomElementShim = memo(forwardRef(CustomElementShimInner));
