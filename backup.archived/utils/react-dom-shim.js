// Shim for react-dom in React Native environment
// This prevents errors when libraries try to import react-dom

export const createPortal = () => null;
export const findDOMNode = () => null;
export const flushSync = (fn) => fn();
export const unstable_batchedUpdates = (fn) => fn();
export const render = () => null;
export const hydrate = () => null;
export const unmountComponentAtNode = () => null;
export const createRoot = () => ({ render: () => null });

export default {
  createPortal,
  findDOMNode,
  flushSync,
  unstable_batchedUpdates,
  render,
  hydrate,
  unmountComponentAtNode,
  createRoot,
};