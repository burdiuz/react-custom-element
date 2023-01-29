import React, { ComponentType, ReactNode, StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import {
  AttributeCallback,
  CallbackMap,
  CallbackNames,
  CustomElementProvider,
  LifecycleAttributeChangedCallback,
  LifecycleCallback,
  ProviderInitCallback,
  ProviderInitCallbackParams,
} from "./context";

type RendererParams = {
  container: HTMLElement;
  onMount?: ProviderInitCallback;
  onUnmount?: ProviderInitCallback;
};

export const createRenderFn = (RootComponent: ComponentType) => () =>
  <RootComponent />;

export const defaultRenderer = (
  renderFn: () => ReactNode,
  { container, onMount, onUnmount }: RendererParams
) => {
  const reactRoot = createRoot(container.shadowRoot || container);
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

function callByName<T extends Function, K extends Array<unknown>>(
  map: CallbackMap<T>,
  name: string,
  args: K
) {
  map?.get(name)?.forEach((callback) => callback(...args));
}

export type CreateCustomElementClassParams = {
  render: () => ReactNode;
  renderer?: (render: () => ReactNode, params: RendererParams) => Root;
  shadowDomMode?: ShadowRootMode;
  attributes?: string[];
  baseClass?: typeof HTMLElement;
  onCreated?: (element: HTMLElement) => void;
  onConnected?: (element: HTMLElement) => void;
  onDisconnected?: (element: HTMLElement) => void;
  onAdopted?: (element: HTMLElement) => void;
  onAttributeChanged?: LifecycleAttributeChangedCallback;
  onMount?: ProviderInitCallback;
  onUnmount?: ProviderInitCallback;
};

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
}: CreateCustomElementClassParams): typeof HTMLElement =>
  class CustomElement extends BaseClass {
    static get observedAttributes() {
      return attributes;
    }

    public reactRoot: Root;
    public lifecycleCallbacks: CallbackMap<LifecycleCallback> = new Map();
    public attributeCallbacks: CallbackMap<AttributeCallback> = new Map();

    constructor() {
      super();
      this.attachShadow({ mode: shadowDomMode });

      this.reactRoot = renderer(render, {
        container: this,
        onMount: (params: ProviderInitCallbackParams) => {
          // Object.assign(this, params);

          this.lifecycleCallbacks = params.lifecycleCallbacks;
          this.attributeCallbacks = params.attributeCallbacks;

          onMount?.(params);
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

    attributeChangedCallback(
      name: string,
      oldValue: string | undefined,
      newValue: string | undefined
    ) {
      onAttributeChanged?.(this, name, oldValue, newValue);
      callByName(this.lifecycleCallbacks, CallbackNames.ATTRIBUTE_CHANGED, [
        this,
        name,
        oldValue,
        newValue,
      ]);
      callByName(this.attributeCallbacks, name, [name, oldValue, newValue]);
    }
  };
