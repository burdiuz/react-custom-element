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

type ContainerRendererParams = {
  container: HTMLElement;
  onMount?: ProviderInitCallback;
  onUnmount?: ProviderInitCallback;
};

export const MOUNT_EVENT = "appmount";
export const UNMOUNT_EVENT = "appunmount";

export const createRenderFn = (RootComponent: ComponentType) => () =>
  <RootComponent />;

/**
 * Remove StrictMode in this renderer because it double-mounts
 * components which does dispatch mount/unmount events twice.
 * @see https://github.com/reactwg/react-18/discussions/19
 */
export const containerRendererWithoutStrictMode = (
  renderFn: () => ReactNode,
  { container, onMount, onUnmount }: ContainerRendererParams
) => {
  const reactRoot = createRoot(container.shadowRoot || container);
  reactRoot.render(
    <CustomElementProvider
      container={container}
      onMount={onMount}
      onUnmount={onUnmount}
    >
      {renderFn()}
    </CustomElementProvider>
  );

  return reactRoot;
};

export const defaultContainerRenderer = (
  renderFn: () => ReactNode,
  { container, onMount, onUnmount }: ContainerRendererParams
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

  return reactRoot;
};

function callByName<T extends Function, K extends Array<unknown>>(
  map: CallbackMap<T>,
  name: string,
  args: K
) {
  map?.get(name)?.forEach((callback) => callback(...args));
}

export interface BaseHTMLElement extends HTMLElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(
    name: string,
    oldValue: string | undefined,
    newValue: string | undefined
  ): void;
}

/**
 * @fires CustomHTMLElement#approotmount
 * @fires CustomHTMLElement#approotunmount
 */
export interface CustomHTMLElement extends HTMLElement {
  reactRoot?: Root;
  onAppmount?: (instance: CustomHTMLElement) => void;
  onAppunmount?: (instance: CustomHTMLElement) => void;
}

export type CreateCustomElementClassParams = {
  render: () => ReactNode;
  renderContainer?: (
    render: () => ReactNode,
    params: ContainerRendererParams
  ) => Root;
  shadowDomMode?: ShadowRootMode;
  attributes?: string[];
  baseClass?: new () => BaseHTMLElement;
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
  renderContainer = defaultContainerRenderer,
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
}: CreateCustomElementClassParams): new () => CustomHTMLElement =>
  class CustomElement extends BaseClass {
    static get observedAttributes() {
      return attributes;
    }

    public reactRoot?: Root;
    public onAppmount?: (instance: CustomHTMLElement) => void;
    public onAppunmount?: (instance: CustomHTMLElement) => void;
    public lifecycleCallbacks: CallbackMap<LifecycleCallback> = new Map();
    public attributeCallbacks: CallbackMap<AttributeCallback> = new Map();

    constructor() {
      super();
      this.attachShadow({ mode: shadowDomMode });
      onCreated?.(this);
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.reactRoot = renderContainer(render, {
        container: this,
        onMount: (params: ProviderInitCallbackParams) => {
          // Object.assign(this, params);

          this.lifecycleCallbacks = params.lifecycleCallbacks;
          this.attributeCallbacks = params.attributeCallbacks;

          onMount?.(params);
          this.dispatchEvent(new Event(MOUNT_EVENT));
          this.onAppmount?.(this);
        },
        onUnmount: (params) => {
          onUnmount?.(params);
          this.dispatchEvent(new Event(UNMOUNT_EVENT));
          this.onAppunmount?.(this);
        },
      });

      onConnected?.(this);
      callByName(this.lifecycleCallbacks, CallbackNames.CONNECTED, [this]);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      onDisconnected?.(this);
      callByName(this.lifecycleCallbacks, CallbackNames.DISCONNECTED, [this]);
    }

    adoptedCallback() {
      super.adoptedCallback?.();
      onAdopted?.(this);
      callByName(this.lifecycleCallbacks, CallbackNames.ADOPTED, [this]);
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | undefined,
      newValue: string | undefined
    ) {
      super.attributeChangedCallback?.(name, oldValue, newValue);

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
