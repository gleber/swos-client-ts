interface EitherI<A, E> {
  // Methods
  isResult(): this is Result<A>;
  isError(): this is Failure<E>;
  getResult(): A;
  getError(): E;
  map<B>(f: (a: A) => B): Either<B, E>;
  flatMap<B, E2>(f: (a: A) => Either<B, E2>): Either<B, E | E2>;
  fold<R>(onResult: (a: A) => R, onError: (e: E) => R): R;
  getOrElse(defaultValue: A): A;
}

class Result<A> implements EitherI<A, never> {
  constructor(public readonly value: A) { }

  isResult(): this is Result<A> {
    return true;
  }

  isError(): this is Failure<never> {
    return false;
  }

  getResult(): A {
    return this.value;
  }

  getError(): never {
    throw new globalThis.Error('Cannot get error from result');
  }

  map<B>(f: (a: A) => B): Either<B, never> {
    return new Result(f(this.value));
  }

  flatMap<B, E2>(f: (a: A) => Either<B, E2>): Either<B, E2> {
    return f(this.value);
  }

  fold<R>(onResult: (a: A) => R, onError: (e: never) => R): R {
    return onResult(this.value);
  }

  getOrElse(defaultValue: A): A {
    return this.value;
  }
}

class Failure<E> implements EitherI<never, E> {
  constructor(public readonly value: E) { }

  isResult(): this is Result<never> {
    return false;
  }

  isError(): this is Failure<E> {
    return true;
  }

  getResult(): never {
    throw new globalThis.Error('Cannot get result from error');
  }

  getError(): E {
    return this.value;
  }

  map<B>(f: (a: never) => B): Either<B, E> {
    return this;
  }

  flatMap<B, E2>(f: (a: never) => Either<B, E2>): Either<B, E> {
    return this;
  }

  fold<R>(onResult: (a: never) => R, onError: (e: E) => R): R {
    return onError(this.value);
  }

  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }
}

type Either<A, E> = Result<A> | Failure<E>;

const Either = {
  result: <A>(a: A): Result<A> => new Result(a),
  error: <E>(e: E): Failure<E> => new Failure(e),
};

// Export Failure as Error to match usage requirements and user request
export { Either, Result, Failure as Error };
