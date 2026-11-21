import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface UseKeyboardInsetOptions {
  containerRef?: React.RefObject<View | null>;
  subtractSafeAreaBottomOnIOS?: boolean;
  enabled?: boolean;
}

export interface UseKeyboardInsetResult {
  keyboardInset: number;
  isKeyboardVisible: boolean;
}

export function useKeyboardInset(
  options: UseKeyboardInsetOptions = {}
): UseKeyboardInsetResult {
  const {
    containerRef,
    subtractSafeAreaBottomOnIOS = false,
    enabled = true,
  } = options;

  const insets = useSafeAreaInsets();
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const visibleRef = useRef(false);
  const insetsBottomRef = useRef(insets.bottom);

  useEffect(() => {
    insetsBottomRef.current = insets.bottom;
  }, [insets.bottom]);

  useEffect(() => {
    if (!enabled) {
      visibleRef.current = false;
      setKeyboardInset(0);
      setIsKeyboardVisible(false);
      return;
    }

    if (Platform.OS === 'android') {
      const handleShow = (e: KeyboardEvent) => {
        visibleRef.current = true;
        setIsKeyboardVisible(true);

        const fallback = subtractSafeAreaBottomOnIOS
          ? Math.max(0, Math.round(e.endCoordinates.height))
          : Math.max(0, Math.round(e.endCoordinates.height + insetsBottomRef.current));

        if (containerRef?.current?.measureInWindow) {
          containerRef.current.measureInWindow((_x, y, _w, h) => {
            if (!visibleRef.current) return;
            if (h > 0 && e.endCoordinates.screenY > 0) {
              const containerBottom = y + h;
              const overlap = Math.max(
                0,
                Math.round(containerBottom - e.endCoordinates.screenY)
              );
              setKeyboardInset(overlap);
            } else {
              setKeyboardInset(fallback);
            }
          });
        } else {
          setKeyboardInset(fallback);
        }
      };

      const handleHide = () => {
        visibleRef.current = false;
        setIsKeyboardVisible(false);
        setKeyboardInset(0);
      };

      const showSub = Keyboard.addListener('keyboardDidShow', handleShow);
      const hideSub = Keyboard.addListener('keyboardDidHide', handleHide);

      return () => {
        visibleRef.current = false;
        showSub.remove();
        hideSub.remove();
      };
    }

    if (Platform.OS === 'ios') {
      const handleWillShow = (e: KeyboardEvent) => {
        visibleRef.current = true;
        Keyboard.scheduleLayoutAnimation(e);
        const raw = e.endCoordinates.height;
        const inset = Math.max(
          0,
          Math.round(subtractSafeAreaBottomOnIOS ? raw - insetsBottomRef.current : raw)
        );
        setKeyboardInset(inset);
        setIsKeyboardVisible(true);
      };

      const handleWillHide = (e: KeyboardEvent) => {
        visibleRef.current = false;
        Keyboard.scheduleLayoutAnimation(e);
        setKeyboardInset(0);
        setIsKeyboardVisible(false);
      };

      const handleDidHide = () => {
        visibleRef.current = false;
        setKeyboardInset(0);
        setIsKeyboardVisible(false);
      };

      const willShowSub = Keyboard.addListener('keyboardWillShow', handleWillShow);
      const willHideSub = Keyboard.addListener('keyboardWillHide', handleWillHide);
      const didHideSub = Keyboard.addListener('keyboardDidHide', handleDidHide);

      return () => {
        visibleRef.current = false;
        willShowSub.remove();
        willHideSub.remove();
        didHideSub.remove();
      };
    }

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.visualViewport) {
        return;
      }

      const vv = window.visualViewport;
      const update = () => {
        const overlap = Math.max(
          0,
          Math.round(window.innerHeight - vv.height - vv.offsetTop)
        );
        if (overlap > 100) {
          visibleRef.current = true;
          setKeyboardInset(overlap);
          setIsKeyboardVisible(true);
        } else {
          visibleRef.current = false;
          setKeyboardInset(0);
          setIsKeyboardVisible(false);
        }
      };

      update();
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);

      return () => {
        visibleRef.current = false;
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      };
    }

    return undefined;
  }, [containerRef, enabled, subtractSafeAreaBottomOnIOS]);

  return { keyboardInset, isKeyboardVisible };
}
