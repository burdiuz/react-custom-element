import React, {
  memo,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

const isEventName = (name) => /^on[A-Z]/.test(name);

/*
 * Does not support Capture phase yet
 */
const handlerToEventName = (name) =>
  name.charAt(2).toLowerCase() + name.substring(3);

const filterEventProps = (all) => {
  const props = {};
  const events = {};

  Object.keys(all).forEach((name) => {
    if (isEventName(name)) {
      events[name] = all[name];
      return;
    }

    props[name] = all[name];
  });

  return [events, props];
};

export const CustomElementShim = memo(
  forwardRef(({ name: ChildComponent, ...shimProps }, outputRef) => {
    const events = useRef({});
    const element = useRef();

    const [eventProps, props] = filterEventProps(shimProps);

    useImperativeHandle(outputRef, () => element.current);

    /**
     * This effect does not have dependencies and runs on every render.
     * It checks event handlers and updates listeners accordingly.
     * Latest event listeners are stored in "events" ref.
     */
    useEffect(() => {
      const prevEvents = events.current;
      const newEvents = {};

      Object.keys(eventProps).forEach((name) => {
        // if listener was not registered before, create new and add to element
        if (!prevEvents[name]) {
          const handler = (event) => {
            handler.callback(event);
          };
          handler.callback = eventProps[name];
          newEvents[name] = handler;

          element.current.addEventListener(handlerToEventName(name), handler);
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
        element.current.removeEventListener(
          handlerToEventName(name),
          prevEvents[name]
        );
      });

      events.current = newEvents;
    });

    return <ChildComponent ref={element} {...props} />;
  })
);
