import { createCustomElementClass } from "./element";
export * from "./shim";

export const defineCustomElement = ({ name, elementClass, extendsElement }) => {
  window.customElements.define(name, elementClass, {
    extends: extendsElement,
  });
};

export const createCustomElement = ({
  name,
  extendsElement = undefined,
  ...params
}) => {
  const CustomElement = createCustomElementClass(params);

  defineCustomElement({
    name,
    extends: extendsElement,
    elementClass: CustomElement,
  });

  return CustomElement;
};
