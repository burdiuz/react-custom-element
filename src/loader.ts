import { ReactNode, useEffect, useState } from "react";

const getURL = (path: string) => {
  if (/^[a-z]:\/\//.test(path)) {
    return path;
  }

  const { origin, pathname } = window.location;

  return String(new URL(path, `${origin}${pathname}`));
};

export const defaultLoaderFn = (src: string) =>
  // eval('import(getURL(src))')
  import(/* webpackIgnore: true */ getURL(src));

export type LoaderProps<T> = {
  src: string;
  loader?: (src: string) => Promise<T>;
  onLoadStart?: () => void;
  onLoadComplete?: (defs: T) => void;
  onError?: (error: unknown) => void;
  fallback?: () => ReactNode | ReactNode;
  children?: (defs: T) => ReactNode | ReactNode;
};

export function Loader<T = Record<string, unknown>>({
  src,
  loader = defaultLoaderFn,
  onLoadStart,
  onLoadComplete,
  onError,
  fallback,
  children,
}: LoaderProps<T>) {
  const [definition, setDefinition] = useState<T | null>(null);

  useEffect(() => {
    setDefinition(null);
    onLoadStart?.();

    loader(src)
      .then((defs) => {
        setDefinition(defs);
        onLoadComplete?.(defs);
      })
      .catch((error) => {
        onError?.(error);
      });
  }, [src]);

  if (!definition) {
    return typeof fallback === "function" ? fallback() : fallback;
  }

  return typeof children === "function" ? children(definition) : children;
}
