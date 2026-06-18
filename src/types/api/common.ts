export type Nullable<T> = T | null;

export type Maybe<T> = T | null | undefined;

export type ApiFailure = {
  ok: false;
  message?: string;
  detailedMessage?: Nullable<string>;
};

export type ApiSuccess<
  T extends Record<string, unknown> = Record<string, never>,
> = { ok: true } & T;

export type ApiResult<T extends Record<string, unknown>> =
  | ApiSuccess<T>
  | ApiFailure;
