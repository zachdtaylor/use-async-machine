import React from "react";
import type {
  UseAsyncEvent,
  UseAsyncOptions,
  UseAsyncReducer,
  UseAsyncState,
  UseAsync,
} from "./types";

/*
  useSafeDispatch checks if the component is mounted before calling `dispatch`.
  
  Why do we need this? Because the component that calls useAsync() could potentially become
  unmounted before the promise is resolved (or rejected). If `dispatch` gets called, but the
  component is no longer mounted, we have a memory leak! Don't want that.
*/
const useSafeDispatch = (dispatch) => {
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return React.useCallback(
    (...args) => (mounted.current ? dispatch(...args) : undefined),
    [dispatch]
  );
};

function transition(state, event, stateMachine) {
  return stateMachine[state.state][event.type]
    ? stateMachine[state.state][event.type](event, state)
    : state;
}

function exec(state, effects) {
  return effects[state.state] && effects[state.state](state);
}

const stateMachine = {
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
};

function asyncReducer<TData, TError, TContext>(
  state: UseAsyncState<TData, TError, TContext>,
  event: UseAsyncEvent<TData, TError, TContext>
): UseAsyncState<TData, TError, TContext> {
  return transition(state, event, stateMachine);
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

  const safeDispatch = useSafeDispatch(dispatch);

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
          .then((data) => safeDispatch({ type: "asyncSuccess", data }))
          .catch((error) => safeDispatch({ type: "asyncError", error }));
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
    dispatch: safeDispatch,
  };
}
