import { useEffect, useState } from 'react';
import { useColorScheme as useColorSchemeCore } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const coreScheme = useColorSchemeCore();
  const [scheme, setScheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return coreScheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateScheme = (matches: boolean) => {
      const next = matches ? 'dark' : 'light';
      setScheme(next);
      if (typeof document !== 'undefined') {
        if (matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    updateScheme(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => updateScheme(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return scheme;
}
