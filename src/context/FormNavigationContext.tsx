import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, Platform, ScrollView, TextInput, View } from 'react-native';

export interface FormFieldRegistration {
  id: string;
  label: string;
  order: number;
  inputRef: React.RefObject<TextInput | null>;
  containerRef?: React.RefObject<View | null>;
}

export interface FormNavigationContextValue {
  registerField: (field: FormFieldRegistration) => () => void;
  notifyFocus: (id: string) => void;
  notifyBlur: (id: string) => void;
  focusNext: (fromId?: string) => boolean;
  focusPrev: (fromId?: string) => boolean;
  dismissKeyboard: () => void;
  hasNext: (id: string) => boolean;
  hasPrev: (id: string) => boolean;
  activeFieldId: string | null;
  activeFieldLabel: string | null;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export interface FormNavigationProviderProps {
  scrollRef: React.RefObject<ScrollView | null>;
  scrollViewportRef: React.RefObject<View | null>;
  scrollOffsetRef: React.MutableRefObject<number>;
  keyboardInset: number;
  isKeyboardVisible?: boolean;
  children: React.ReactNode;
}

const FormNavigationContext = createContext<FormNavigationContextValue | null>(null);

export const FormNavigationProvider: React.FC<FormNavigationProviderProps> = ({
  scrollRef,
  scrollViewportRef,
  scrollOffsetRef,
  keyboardInset,
  isKeyboardVisible = false,
  children,
}) => {
  const fieldsRef = useRef<Map<string, FormFieldRegistration>>(new Map());
  const activeFieldIdRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [registryVersion, setRegistryVersion] = useState(0);

  const getOrderedFields = useCallback((): FormFieldRegistration[] => {
    return Array.from(fieldsRef.current.values()).sort((a, b) => a.order - b.order);
  }, []);

  const clearPendingScroll = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const scrollFieldIntoView = useCallback(
    (id: string) => {
      const field = fieldsRef.current.get(id);
      if (!field) return;

      if (Platform.OS === 'web') {
        const el = (field.inputRef.current ??
          field.containerRef?.current) as unknown as HTMLElement | null;
        el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
        return;
      }

      const viewport = scrollViewportRef.current;
      const target = field.containerRef?.current ?? field.inputRef.current;
      if (!viewport?.measureInWindow || !target?.measureInWindow) return;

      viewport.measureInWindow((_vx, vy, _vw, vh) => {
        if (vh <= 0) return;

        target.measureInWindow((_ix, iy, _iw, ih) => {
          if (ih <= 0) return;

          const viewportTop = vy;
          const viewportBottom = vy + vh;
          const inputTop = iy;
          const inputBottom = iy + ih;
          const bottomMargin = 28;
          const topMargin = 20;

          if (inputBottom + bottomMargin > viewportBottom) {
            const delta = inputBottom + bottomMargin - viewportBottom;
            scrollRef.current?.scrollTo({
              y: Math.max(0, scrollOffsetRef.current + delta),
              animated: true,
            });
          } else if (inputTop - topMargin < viewportTop) {
            const delta = inputTop - topMargin - viewportTop;
            scrollRef.current?.scrollTo({
              y: Math.max(0, scrollOffsetRef.current + delta),
              animated: true,
            });
          }
        });
      });
    },
    [scrollOffsetRef, scrollRef, scrollViewportRef]
  );

  const scheduleScrollIntoView = useCallback(
    (id: string) => {
      clearPendingScroll();
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        scrollFieldIntoView(id);
      });
      timeoutIdRef.current = setTimeout(() => {
        timeoutIdRef.current = null;
        scrollFieldIntoView(id);
      }, 90);
    },
    [clearPendingScroll, scrollFieldIntoView]
  );

  useEffect(() => {
    return () => {
      clearPendingScroll();
    };
  }, [clearPendingScroll]);

  useEffect(() => {
    if ((keyboardInset > 0 || isKeyboardVisible) && activeFieldIdRef.current) {
      scheduleScrollIntoView(activeFieldIdRef.current);
    }
  }, [isKeyboardVisible, keyboardInset, scheduleScrollIntoView]);

  const registerField = useCallback((field: FormFieldRegistration) => {
    const existing = fieldsRef.current.get(field.id);
    fieldsRef.current.set(field.id, field);

    if (
      !existing ||
      existing.label !== field.label ||
      existing.order !== field.order
    ) {
      setRegistryVersion(v => v + 1);
    }

    return () => {
      if (fieldsRef.current.get(field.id) === field) {
        fieldsRef.current.delete(field.id);
        setRegistryVersion(v => v + 1);
        if (activeFieldIdRef.current === field.id) {
          activeFieldIdRef.current = null;
        }
        setActiveFieldId(prev => (prev === field.id ? null : prev));
      }
    };
  }, []);

  const notifyFocus = useCallback(
    (id: string) => {
      activeFieldIdRef.current = id;
      setActiveFieldId(id);
      scheduleScrollIntoView(id);
    },
    [scheduleScrollIntoView]
  );

  const notifyBlur = useCallback((id: string) => {
    if (activeFieldIdRef.current === id) {
      activeFieldIdRef.current = null;
    }
    setActiveFieldId(prev => (prev === id ? null : prev));
  }, []);

  const focusNext = useCallback(
    (fromId?: string): boolean => {
      const currentId = fromId ?? activeFieldIdRef.current;
      if (!currentId) return false;

      const ordered = getOrderedFields();
      const idx = ordered.findIndex(f => f.id === currentId);
      if (idx < 0 || idx >= ordered.length - 1) return false;

      const target = ordered[idx + 1];
      if (!target?.inputRef.current) return false;

      target.inputRef.current.focus();
      return true;
    },
    [getOrderedFields]
  );

  const focusPrev = useCallback(
    (fromId?: string): boolean => {
      const currentId = fromId ?? activeFieldIdRef.current;
      if (!currentId) return false;

      const ordered = getOrderedFields();
      const idx = ordered.findIndex(f => f.id === currentId);
      if (idx <= 0) return false;

      const target = ordered[idx - 1];
      if (!target?.inputRef.current) return false;

      target.inputRef.current.focus();
      return true;
    },
    [getOrderedFields]
  );

  const hasNext = useCallback(
    (id: string): boolean => {
      const ordered = getOrderedFields();
      const idx = ordered.findIndex(f => f.id === id);
      return idx >= 0 && idx < ordered.length - 1;
    },
    [getOrderedFields]
  );

  const hasPrev = useCallback(
    (id: string): boolean => {
      const ordered = getOrderedFields();
      const idx = ordered.findIndex(f => f.id === id);
      return idx > 0;
    },
    [getOrderedFields]
  );

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    activeFieldIdRef.current = null;
    setActiveFieldId(null);
  }, []);

  const contextValue = useMemo<FormNavigationContextValue>(() => {
    const ordered = registryVersion >= 0 ? getOrderedFields() : [];
    const activeIndex = activeFieldId
      ? ordered.findIndex(f => f.id === activeFieldId)
      : -1;
    const activeFieldLabel = activeIndex >= 0 ? ordered[activeIndex].label : null;
    const canGoPrev = activeIndex > 0;
    const canGoNext = activeIndex >= 0 && activeIndex < ordered.length - 1;

    return {
      registerField,
      notifyFocus,
      notifyBlur,
      focusNext,
      focusPrev,
      dismissKeyboard,
      hasNext,
      hasPrev,
      activeFieldId,
      activeFieldLabel,
      canGoPrev,
      canGoNext,
    };
  }, [
    activeFieldId,
    dismissKeyboard,
    focusNext,
    focusPrev,
    getOrderedFields,
    hasNext,
    hasPrev,
    notifyBlur,
    notifyFocus,
    registerField,
    registryVersion,
  ]);

  return (
    <FormNavigationContext.Provider value={contextValue}>
      {children}
    </FormNavigationContext.Provider>
  );
};

export function useFormNavigation(): FormNavigationContextValue | null {
  return useContext(FormNavigationContext);
}
