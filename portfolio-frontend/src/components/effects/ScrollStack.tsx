import { useLayoutEffect, useRef, useCallback, type ReactNode } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';

export interface ScrollStackItemProps {
  children: ReactNode;
  itemClassName?: string;
}

export const ScrollStackItem = ({ children, itemClassName = '' }: ScrollStackItemProps) => (
  <div className="scroll-stack-card-wrapper w-full relative">
    <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
  </div>
);

export interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

interface CardTransformState {
  translateY: number;
  scale: number;
  rotation: number;
  blur: number;
}

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 300,
  itemScale = 0,
  itemStackDistance = 0,
  stackPosition = '12%',
  scaleEndPosition = '6%',
  baseScale = 1,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}: ScrollStackProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const wrappersRef = useRef<HTMLElement[]>([]);
  const staticTopsRef = useRef<number[]>([]);
  const endElementTopRef = useRef<number>(0);
  const lastTransformsRef = useRef<Map<number, CardTransformState>>(new Map());
  const isUpdatingRef = useRef(false);

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return typeof value === 'number' ? value : parseFloat(value);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight,
        scrollContainer: document.documentElement
      };
    } else {
      const scroller = scrollerRef.current;
      return {
        scrollTop: scroller?.scrollTop ?? 0,
        containerHeight: scroller?.clientHeight ?? window.innerHeight,
        scrollContainer: scroller ?? document.documentElement
      };
    }
  }, [useWindowScroll]);

  // Measure static un-transformed positions from the wrappers to guarantee zero feedback loop
  const measureStaticPositions = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const wrappers = Array.from(
      scroller.querySelectorAll('.scroll-stack-card-wrapper')
    ) as HTMLElement[];
    wrappersRef.current = wrappers;

    const cards = Array.from(
      scroller.querySelectorAll('.scroll-stack-card')
    ) as HTMLElement[];
    cardsRef.current = cards;

    const tops: number[] = [];
    wrappers.forEach((wrapper, i) => {
      if (useWindowScroll) {
        const rect = wrapper.getBoundingClientRect();
        tops.push(rect.top + window.scrollY);
      } else {
        tops.push(wrapper.offsetTop);
      }

      // Ensure explicit z-index layering so subsequent cards strictly stack on top
      if (cards[i]) {
        cards[i].style.zIndex = `${i + 1}`;
      }
    });
    staticTopsRef.current = tops;

    const endElement = scroller.querySelector('.scroll-stack-end') as HTMLElement | null;
    if (endElement) {
      if (useWindowScroll) {
        endElementTopRef.current = endElement.getBoundingClientRect().top + window.scrollY;
      } else {
        endElementTopRef.current = endElement.offsetTop;
      }
    }
  }, [useWindowScroll]);

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);
    const endElementTop = endElementTopRef.current;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      // Use the static pre-measured top to completely eliminate transform vibration
      const cardTop = staticTopsRef.current[i] ?? 0;
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i;
      const pinEnd = endElementTop > 0 ? endElementTop - containerHeight / 2 : Infinity;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCardTop = staticTopsRef.current[j] ?? 0;
          const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j;
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j;
          }
        }

        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i;
          blur = Math.max(0, depthInStack * blurAmount);
        }
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
      }

      const newTransform: CardTransformState = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1;

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

        card.style.transform = transform;
        card.style.filter = filter;

        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    calculateProgress,
    parsePercentage,
    getScrollData
  ]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      // Connect to master Lenis instance if available to avoid duplicate RAF loops and frame collision
      const masterLenis = (window as any).lenis as Lenis | undefined;
      if (masterLenis) {
        masterLenis.on('scroll', handleScroll);
        lenisRef.current = masterLenis;
        return masterLenis;
      }

      // Standalone fallback: only instantiate if no root Lenis is present
      const lenis = new Lenis({
        duration: 1.0,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075
      } as any);

      lenis.on('scroll', handleScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    } else {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const lenis = new Lenis({
        wrapper: scroller,
        content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
        duration: 1.0,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        gestureOrientationHandler: true,
        normalizeWheel: true,
        wheelMultiplier: 1,
        touchInertiaMultiplier: 35,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075,
        touchInertia: 0.6
      } as any);

      lenis.on('scroll', handleScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    }
  }, [handleScroll, useWindowScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Apply distance to wrappers to establish real layout spacing
    const wrappers = Array.from(
      scroller.querySelectorAll('.scroll-stack-card-wrapper')
    ) as HTMLElement[];
    wrappers.forEach((wrapper, i) => {
      if (i < wrappers.length - 1) {
        wrapper.style.marginBottom = `${itemDistance}px`;
      } else {
        wrapper.style.marginBottom = '0px';
      }
    });

    const cards = Array.from(scroller.querySelectorAll('.scroll-stack-card')) as HTMLElement[];
    cards.forEach((card, i) => {
      card.style.willChange = 'transform, filter';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translateZ(0)';
      card.style.webkitTransform = 'translateZ(0)';
      card.style.perspective = '1000px';
      card.style.webkitPerspective = '1000px';
      card.style.zIndex = `${i + 1}`;
    });

    const transformsCache = lastTransformsRef.current;

    measureStaticPositions();
    setupLenis();
    updateCardTransforms();

    const handleResize = () => {
      measureStaticPositions();
      updateCardTransforms();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (useWindowScroll && (window as any).lenis && lenisRef.current === (window as any).lenis) {
        (window as any).lenis.off('scroll', handleScroll);
      } else {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (lenisRef.current) {
          lenisRef.current.destroy();
        }
      }
      window.removeEventListener('resize', handleResize);
      stackCompletedRef.current = false;
      cardsRef.current = [];
      wrappersRef.current = [];
      staticTopsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms,
    measureStaticPositions
  ]);

  return (
    <div
      className={`scroll-stack-scroller ${useWindowScroll ? 'use-window-scroll' : ''} ${className}`.trim()}
      ref={scrollerRef}
    >
      <div className="scroll-stack-inner">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end" />
      </div>
    </div>
  );
};

export default ScrollStack;