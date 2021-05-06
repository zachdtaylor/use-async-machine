import type { Dispatch } from "react";

export interface UseAsyncState<
  TData = unknown,
  TError = unknown,
  TContext = unknown
> {
  state: "idle" | "loading" | "success" | "error";
  data?: TData;
  error?: TError;
  context?: TContext;
}

export interface UseAsyncEvent<
  TData = unknown,
  TError = unknown,
  TContext = unknown
> {
  type: "load" | "asyncSuccess" | "asyncError" | "reset";
  data?: TData;
  error?: TError;
  context?: TContext;
}

export interface UseAsyncOptions<
  TData = unknown,
  TError = unknown,
  TContext = unknown
> {
  onLoad?: (state: UseAsyncState<TData, TError, TContext>) => unknown;
  onSuccess?: (state: UseAsyncState<TData, TError, TContext>) => unknown;
  onError?: (state: UseAsyncState<TData, TError, TContext>) => unknown;
}

export interface UseAsyncReducer<TData, TError, TContext> {
  (
    state: UseAsyncState<TData, TError, TContext>,
    event: UseAsyncEvent<TData, TError, TContext>
  ): UseAsyncState<TData, TError, TContext>;
}

export interface UseAsync<TData, TError, TContext> {
  state: "idle" | "loading" | "success" | "error";
  data?: TData;
  error?: TError;
  context?: TContext;
  isIdle: Boolean;
  isLoading: Boolean;
  isError: Boolean;
  isSuccess: Boolean;
  dispatch: Dispatch<UseAsyncEvent<TData, TError, TContext>>;
}
