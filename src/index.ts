import React from "react";
import type {
  UseAsyncEvent,
  UseAsyncOptions,
  UseAsyncReducer,
  UseAsyncState,
  UseAsync,
} from "./types";

function transition(state, event, transitions) {
  return transitions[state.state][event.type]
    ? transitions[state.state][event.type](event, state)
    : state;
}

function exec(state, effects) {
  return effects[state.state] && effects[state.state](state);
}

function asyncReducer<TData, TError, TContext>(
  state: UseAsyncState<TData, TError, TContext>,
  event: UseAsyncEvent<TData, TError, TContext>
): UseAsyncState<TData, TError, TContext> {
  return transition(state, event, {
    idle: {
      load: ({ context }) => ({ state: "loading", context }),
    },
    loading: {
      asyncSuccess: ({ data }) => ({ state: "success", data }),
      asyncError: ({ error }) => ({ state: "error", error }),
    },
    success: {
      load: ({ context }) => ({ state: "loading", context }),
      reset: () => ({ state: "idle" }),
    },
    error: {
      load: ({ context }) => ({ state: "loading", context }),
      reset: () => ({ state: "idle" }),
    },
  });
}

const initialState: UseAsyncState = { state: "idle" };

export default function useAsync<TData, TError, TContext>(
  fn: (state: UseAsyncState<TData, TError, TContext>) => Promise<TData>,
  options: UseAsyncOptions<TData, TError, TContext> = {}
): UseAsync<TData, TError, TContext> {
  const [state, dispatch] = React.useReducer(
    asyncReducer as UseAsyncReducer<TData, TError, TContext>,
    initialState as UseAsyncState<TData, TError, TContext>
  );

  React.useEffect(() => {
    exec(state, {
      loading: (state: UseAsyncState<TData, TError, TContext>) => {
        const promise = fn(state);
        if (!promise || !promise.then) {
          throw new Error(
            `The function passed to useAsync() must return a promise`
          );
        }
        options.onLoad?.(state);
        promise
          .then((data) => dispatch({ type: "asyncSuccess", data }))
          .catch((error) => dispatch({ type: "asyncError", error }));
      },
      success: (state: UseAsyncState<TData, TError, TContext>) => {
        options.onSuccess?.(state);
      },
      error: (state: UseAsyncState<TData, TError, TContext>) => {
        options.onError?.(state);
      },
    });
  }, [state, fn]);

  return {
    state: state.state,
    data: state.data,
    error: state.error,
    context: state.context,
    isIdle: state.state === "idle",
    isError: state.state === "error",
    isLoading: state.state === "loading",
    isSuccess: state.state === "success",
    dispatch,
  };
}
