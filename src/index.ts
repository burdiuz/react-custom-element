import {
  createCustomElementClass,
  CreateCustomElementClassParams,
} from "./element";
export * from "./shim";
export * from "./context";

export const defineCustomElement = ({
  name,
  elementClass,
  extendsElement,
}: {
  name: string;
  elementClass: typeof HTMLElement;
  extendsElement?: string;
}) => {
  window.customElements.define(name, elementClass, {
    extends: extendsElement,
  });
};

export const createCustomElement = ({
  name,
  extendsElement = undefined,
  ...params
}: {
  name: string;
  extendsElement?: string;
} & CreateCustomElementClassParams) => {
  const CustomElement = createCustomElementClass(params);

  defineCustomElement({
    name,
    extendsElement,
    elementClass: CustomElement,
  });

  return CustomElement;
};
