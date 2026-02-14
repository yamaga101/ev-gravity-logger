import { useRef, useCallback, useEffect } from "react";

export function useRepeater(
  callback: () => void,
  delay: number = 500,
  interval: number = 100,
) {
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    stop();
    isRunningRef.current = true;
    callbackRef.current();
    timeoutIdRef.current = setTimeout(() => {
      if (!isRunningRef.current) return;
      intervalIdRef.current = setInterval(() => {
        if (isRunningRef.current) callbackRef.current();
        else stop();
      }, interval);
    }, delay);
  }, [delay, interval, stop]);

  useEffect(() => stop, [stop]);

  return { start, stop };
}
