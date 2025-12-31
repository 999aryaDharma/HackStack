// src/core/hooks/useTimer.ts
import { useState, useEffect, useRef } from "react";

export function useTimer(initialSeconds: number = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  };

  return { seconds, isRunning, start, pause, reset };
}

// src/core/hooks/useDebounce.ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// src/core/hooks/useResponseTime.ts
import { useState, useCallback } from "react";

export function useResponseTime() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const start = useCallback(() => {
    setStartTime(Date.now());
    setResponseTime(null);
  }, []);

  const end = useCallback(() => {
    if (startTime) {
      const time = Date.now() - startTime;
      setResponseTime(time);
      return time;
    }
    return null;
  }, [startTime]);

  const reset = useCallback(() => {
    setStartTime(null);
    setResponseTime(null);
  }, []);

  return { responseTime, start, end, reset };
}

// src/core/hooks/useNetworkStatus.ts
import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string>("unknown");

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
}

// src/core/hooks/useKeyboard.ts
import { useEffect, useState } from "react";
import { Keyboard, KeyboardEvent } from "react-native";

export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}

// src/core/hooks/usePrevious.ts
import { useRef, useEffect } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// src/core/hooks/useToggle.ts
import { useState, useCallback } from "react";

export function useToggle(
  initialValue: boolean = false
): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  return [value, toggle];
}

// src/core/hooks/useInterval.ts
import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
