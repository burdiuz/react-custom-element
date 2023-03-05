# @actualwave/react-custom-element

Adds support for independent modules wrapped in [HTML Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements). It provides a set of react hooks to establish communication through custom element container, so it is possible to pass data IN via custom element attributes and IN/OUT via events.

[Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
[Using custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
[3 Approaches to Integrate React with Custom Elements](https://css-tricks.com/3-approaches-to-integrate-react-with-custom-elements/)
[Web Components in React](https://reactjs.org/docs/web-components.html)

> Note: This does not isolate environments of running applications, all sub-applications running on one page will have access to same globals and it is possible for one application to interfere with others.

## Installation

This package can be installed via its name `@actualwave/react-custom-element`.
Using NPM

```
npm install @actualwave/react-custom-element
```

Or Yarn

```
yarn add @actualwave/react-custom-element
```

## Integration

We have a react component which we want to use as an independent module, it is a normal react component.

```jsx
const MyComponent = () => {
  return (
    <div>
      <h1>Hello World!</h1>
    </div>
  );
```

Instead of bootstrapping it via ReactDOM.render(), we register it as a custom element.

```jsx
import { createCustomElement } from "@actualwave/react-custom-element";

createCustomElement({
  name: "my-component",
  render: () => <MyComponent />,
});

/**
 * For TypeScript you might need to add declaration fo custom element,
 * so it knows which attributes can be added to it.
 */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["my-component"]: DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          onSomething: (event: Event) => void;
        },
        HTMLElement
      >;
    }
  }
}

createCustomElement({
  name: "my-component",
  render: () => <MyComponent />,
});
```

Then you have to import(or load in any other way) this component and use `<my-component>` HTML element.

```jsx
import { useEffect, useRef } from "react";
import "./App.css";
import "./MyComponent";

function App() {
  return (
    <div className="app">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <my-component></my-component>
    </div>
  );
}

export default App;
```

When custom HTML element is constructed, it will render `MyComponent` component as an independent React application.

## Communication

Since modules integrated with custom elements are independent sub-applications, there are no way to communicate with them traditional React ways -- props or context. But you can communicate with sub-application by passing attributes or dispatching events.

### Attributes

Attributes for custom element can be set or changed at any time and these changes could be captured by sub-application.
Setting attribute

```jsx
<my-component data-value="Something here"></my-component>
```

Reading attribute

```jsx
import {
  createCustomElement,
  useContainerAttribute,
} from "@actualwave/react-custom-element";

const MyComponent = () => {
  const [readValue] = useContainerAttribute("data-value");

  return (
    <div>
      <h1>Hello World!</h1>
      <span>{readValue()}</span>
    </div>
  );
};
```

We can read any custom element attribute but listen for changes only for registered attributes. To register an attribute we have to provide it when registering custom element.

```jsx
createCustomElement({
  name: "my-component",
  render: () => <MyComponent />,
  attributes: ["data-value", "id"],
});
```

Then we can use a change listener and it will be called whenever value of attribute is changed.

```jsx
const MyComponent = () => {
  const [value, setValue] = useState("");

  const [readValue] = useContainerAttribute(
    "data-value",
    (name, oldValue, newValue) => setValue(newValue),
    []
  );

  useEffect(() => {
    setValue(readValue());
  }, [readValue]);

  return (
    <div>
      <h1>Hello World!</h1>
      <span>{value}</span>
    </div>
  );
};
```

And whenever attribute is changed, sub-application will be aware of that change.

```jsx
import { useEffect, useRef } from "react";
import "./App.css";
import "./MyComponent";

function App() {
  const [value, setValue] = useState("");

  return (
    <div className="app">
      <my-component data-value={value}></my-component>
      <button onClick={() => updateValue("New attribute value")}>
        Change Value
      </button>
    </div>
  );
}

export default App;
```

### Events

Events allow to communicate both ways and pass non-serialized data by reference.
React/JSX currently does not register custom events on custom elements. So, something like this may not work.

```jsx
<my-component
  data-value="My value"
  onSomething={(event) => console.log("on something:", event)}
/>
```

One of the ways to make it work is to use `CustomElementShim` which manually assigns event listeners.

```jsx
<CustomElementShim
  name="my-component"
  data-value="My value"
  onSomething={(event) => console.log("on something:", event)}
/>
```

> Note: `CustomElementShim` is not aware of event phases and when using, for example, `onClickCapture` will not register `click` event for capture phase but will register `clickCapture` event for bubbling phase.

These events can be captured from within sub-application components using `useContainerListener` hook

```js
useContainerListener(
  "something",
  (event) => console.log("Event:", event),
  false,
  []
);
```

To dispatch an event from sub-application on custom element use `useContainerDispatch` hook.

```jsx
import { createCustomElement, useContainerDispatch } from "./custom-element";

const MyComponent = () => {
  const doSomething = useContainerDispatch("something");

  return (
    <div>
      <h1>Hello World!</h1>
      <button
        onClick={() => doSomething("There's something interesting here.")}
      >
        Do Something
      </button>
    </div>
  );
};
```
