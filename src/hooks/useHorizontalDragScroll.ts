import { useState, useRef, useEffect } from 'react';
import { Platform, ScrollView } from 'react-native';

interface WebScrollableRef {
  getScrollableNode?: () => HTMLElement;
  scrollBy?: (opts: ScrollToOptions) => void;
  scrollTo?: (opts: ScrollToOptions) => void;
}

export function useHorizontalDragScroll(active: boolean) {
  const scrollRef = useRef<ScrollView>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;

    const getScrollNode = (): HTMLElement | null => {
      const scrollEl = scrollRef.current as unknown as WebScrollableRef | null;
      if (!scrollEl) return null;
      if (typeof scrollEl.getScrollableNode === 'function') {
        return scrollEl.getScrollableNode();
      }
      return scrollEl as unknown as HTMLElement;
    };

    const node = getScrollNode();
    if (!node) return;

    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDown = true;
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      startX = e.pageX - node.offsetLeft;
      scrollStart = node.scrollLeft;
      node.style.cursor = 'grabbing';
      node.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const currentX = e.pageX - node.offsetLeft;
      const walk = (currentX - startX) * 1.25;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      node.scrollLeft = scrollStart - walk;
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      isDraggingRef.current = false;
      node.style.cursor = 'grab';
      node.style.removeProperty('user-select');
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 60);
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0 && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        e.preventDefault();
        node.scrollLeft += e.deltaY;
      }
    };

    node.style.cursor = 'grab';
    node.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    node.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      node.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      node.removeEventListener('wheel', handleWheel);
    };
  }, [active]);

  const handleScroll = (event: {
    nativeEvent: {
      contentOffset: { x: number };
      contentSize: { width: number };
      layoutMeasurement: { width: number };
    };
  }) => {
    const x = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const layoutWidth = event.nativeEvent.layoutMeasurement.width;
    setCanScrollLeft(x > 6);
    setCanScrollRight(x < contentWidth - layoutWidth - 6);
  };

  const scrollBy = (offset: number) => {
    if (Platform.OS === 'web') {
      const scrollEl = scrollRef.current as unknown as WebScrollableRef | null;
      const node = scrollEl?.getScrollableNode?.() || (scrollEl as unknown as HTMLElement);
      if (node && typeof node.scrollBy === 'function') {
        node.scrollBy({ left: offset, behavior: 'smooth' });
        return;
      }
    }
    scrollRef.current?.scrollTo({ x: offset > 0 ? 500 : 0, animated: true });
  };

  const scrollToTarget = (targetX: number) => {
    if (Platform.OS === 'web') {
      const scrollEl = scrollRef.current as unknown as WebScrollableRef | null;
      const node = scrollEl?.getScrollableNode?.() || (scrollEl as unknown as HTMLElement);
      if (node && typeof node.scrollTo === 'function') {
        node.scrollTo({ left: targetX, behavior: 'smooth' });
        return;
      }
    }
    scrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  return {
    scrollRef,
    hasMovedRef,
    canScrollLeft,
    canScrollRight,
    handleScroll,
    scrollBy,
    scrollToTarget,
  };
}
