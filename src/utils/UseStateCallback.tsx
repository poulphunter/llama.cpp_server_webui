import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type Callback<T> = (value?: T) => void;
type DispatchWithCallback<T> = (value: T, callback?: Callback<T>) => void;

function useStateCallback<T>(
  initialState: T | (() => T)
): [T, DispatchWithCallback<SetStateAction<T>>] {
  const [state, setState] = useState(initialState);

  const callbackRef = useRef<Callback<T>>();
  const isFirstCallbackCall = useRef<boolean>(true);

  const setState2 = useCallback(
    (setStateAction: SetStateAction<T>, callback?: Callback<T>): void => {
      callbackRef.current = callback;
      setState(setStateAction);
    },
    []
  );

  useEffect(() => {
    if (isFirstCallbackCall.current) {
      isFirstCallbackCall.current = false;
      return;
    }
    callbackRef.current?.(state);
  }, [state]);

  return [state, setState2];
}

export default useStateCallback;
