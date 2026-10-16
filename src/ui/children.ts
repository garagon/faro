import { Children, Fragment, cloneElement, isValidElement, type ReactNode } from 'react';

/**
 * Children as one flat list: arrays and fragments (a screen may pass several rows in one
 * fragment) are opened, empty values dropped, keys kept unique.
 */
export function flatChildren(children: ReactNode, prefix = ''): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment)
      return flatChildren(child.props.children, `${prefix}${child.key ?? ''}/`);
    return isValidElement(child) && prefix
      ? [cloneElement(child, { key: `${prefix}${child.key ?? ''}` })]
      : [child];
  });
}
