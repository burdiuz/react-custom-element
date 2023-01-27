import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CallbackNames, CustomElementProvider } from "./context";

export const createRenderFn = (RootComponent) => () => <RootComponent />;

export const defaultRenderer = (
  renderFn,
  { container, onMount, onUnmount }
) => {
  const reactRoot = createRoot(container.shadowRoot);
  reactRoot.render(
    <StrictMode>
      <CustomElementProvider
        container={container}
        onMount={onMount}
        onUnmount={onUnmount}
      >
        {renderFn()}
      </CustomElementProvider>
    </StrictMode>
  );

  // <CustomElementConsumer>{() => renderFn()}</CustomElementConsumer>

  return reactRoot;
};

const callByName = (map, name, args) =>
  map?.get(name)?.forEach((callback) => callback(...args));

export const createCustomElementClass = ({
  render,
  renderer = defaultRenderer,
  shadowDomMode = "open",
  attributes = [],
  baseClass: BaseClass = HTMLElement,
  onCreated,
  onConnected,
  onDisconnected,
  onAdopted,
  onAttributeChanged,
  onMount,
  onUnmount,
}) =>
  class CustomElement extends BaseClass {
    static get observedAttributes() {
      return attributes;
    }

    constructor() {
      super();
      this.initialized = false;
      this.attachShadow({ mode: shadowDomMode });

      this.reactRoot = renderer(render, {
        container: this,
        onMount: (params) => {
          // Object.assign(this, params);

          this.lifecycleCallbacks = params.lifecycleCallbacks;
          this.attributeCallbacks = params.attributeCallbacks;

          onMount && onMount(params);
        },
        onUnmount,
      });

      onCreated?.(this);
    }

    connectedCallback() {
      /*
      if(!this.initialized) {
        this.initialized = true;

        render({
          container: this,
          onReactMount,
          onReactUnmount,
        });
      }
      */

      onConnected?.(this);
      callByName(this.lifecycleCallbacks, CallbackNames.CONNECTED, [this]);
    }
    disconnectedCallback() {
      onDisconnected?.(this);
      callByName(this.lifecycleCallbacks, CallbackNames.DISCONNECTED, [this]);
    }
    adoptedCallback() {
      onAdopted?.(this);
      callByName(this.lifecycleCallbacks, CallbackNames.ADOPTED, [this]);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      onAttributeChanged?.(this, name, oldValue, newValue);
      callByName(this.lifecycleCallbacks, CallbackNames.ATTRIBUTE_CHANGED, [
        name,
        oldValue,
        newValue,
      ]);
      callByName(this.attributeCallbacks, name, [name, oldValue, newValue]);
    }
  };
