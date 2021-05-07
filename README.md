# use-async-machine

A hook for using an async state machine. The state machine this library implements looks like this (image generated with [XState Visualizer](https://xstate.js.org/viz/?gist=db191b777cf74bb3652887c4c782bfeb)):

<img width="585" alt="Screen Shot 2021-05-07 at 4 14 47 PM" src="https://user-images.githubusercontent.com/19400680/117509147-5f3c5a00-af4f-11eb-9dcf-c0010d8aa8ab.png">

## Usage

This library exports a single hook to help you with asynchronous operations in your UI.

```jsx
import React from 'react'
import useAsync from 'use-async-machine'

function someAsyncTask() {
  // Returns a promise
}

export default function App() {
  const { data, error, isLoading, isError, dispatch } = useAsync(() => someAsyncTask())

  React.useEffect(() => {
    dispatch({ type: 'load' })
  }, []) // 'dispatch' does not need to be included in dependency array

  if (isLoading) {
    return <Spinner />
  }

  if (isError) {
    return <ErrorMessage error={error}>
  }

  return <div>Here's the result: {data}</div>
}
```

## Use Cases

This library was created out of a need to generate and render a PDF document in the browser. `useAsync` is most useful for client-only asynchronous tasks such as this. If you need to interact with remote data sources, I recommend you try a data caching library such as [react-query](https://react-query.tanstack.com/) or use an SSR framework such as [Remix](https://remix.run/).

## API Reference

```javascript
const {
  state,
  data,
  error,
  context,
  isIdle,
  isLoading,
  isError,
  isSuccess,
  dispatch,
} = useAsync(fn, {
  onLoad,
  onSuccess,
  onError,
});
```

**Options**

- `fn: (state: UseAsyncState<TData, TError, TContext>) => Promise<TData>`
  - The asynchronous function to run on the `load` event.
  - Receives the async state.
  - Must return a promise that either resolves to data or throws an error.
- `onLoad: (state: UseAsyncState<TData, TError, TContext>) => unknown`
  - Function to be called when the state machine enters the `loading` state.
  - Receives the async state
  - Returns nothing
- `onSuccess: (state: UseAsyncState<TData, TError, TContext>) => unknown`
  - Function to be called when the state machine enters the `success` state.
  - Receives the async state
  - Returns nothing
- `onError: (state: UseAsyncState<TData, TError, TContext>) => unknown`
  - Function to be called when the state machine enters the `error` state.
  - Receives the async state
  - Returns nothing

**Returns**

- `state: "idle" | "loading" | "success" | "error"`
  - Defaults to `"idle"`
  - The state of the async function.
- `data: TData`
  - Defaults to `undefined`
  - The resolved data returned by `fn`
- `error: TError`
  - Defaults to `undefined`
  - If `fn` rejects with an error, it will be stored here
- `context: TContext`
  - Defaults to `undefined`
  - May be set by the `"load"` event with `dispatch({ "type": "load", context })`
  - Useful if you want to pass additional context to `fn`
- `isIdle: boolean`
  - Derived from `state`, true if and only if `state === "idle"`
- `isLoading: boolean`
  - Derived from `state`, true if and only if `state === "loading"`
- `isError: boolean`
  - Derived from `state`, true if and only if `state === "error"`
- `isSuccess: boolean`
  - Derived from `state`, true if and only if `state === "success"`
- `dispatch: React.Dispatch<UseAsyncEvent<TData, TError, TContext>>`
  - Dispatch function returned from `React.useReducer`
  - Used to transition between async states.
