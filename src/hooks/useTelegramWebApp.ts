import { useState, useEffect, useCallback } from 'react';
import { TelegramWebUser, TelegramMiniAppStatus } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramWebUser;
          receiver?: TelegramWebUser;
          chat?: any;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'dark' | 'light';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor?: string;
        backgroundColor?: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export function useTelegramWebApp() {
  const [isReady, setIsReady] = useState(false);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [user, setUser] = useState<TelegramWebUser | null>(null);
  const [platform, setPlatform] = useState<string>('browser');
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark');
  const [startParam, setStartParam] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.ready === 'function') {
      try {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation?.();

        const tgUser = tg.initDataUnsafe?.user || null;
        setUser(tgUser);
        setPlatform(tg.platform || 'unknown');
        setColorScheme(tg.colorScheme || 'dark');
        setStartParam(tg.initDataUnsafe?.start_param || null);
        
        // If inside Telegram WebApp, user is detected or platform is not unknown
        const isTelegram = Boolean(tg.initData || tg.initDataUnsafe?.user || (tg.platform && tg.platform !== 'unknown'));
        setIsInTelegram(isTelegram);
      } catch (err) {
        console.warn('Telegram WebApp init exception:', err);
      }
    }
    setIsReady(true);
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'medium') => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;

    try {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch (e) {
      // Haptics not supported in desktop web
    }
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, []);

  const openLink = useCallback((url: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.openLink === 'function') {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, []);

  const closeMiniApp = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.close === 'function') {
      tg.close();
    }
  }, []);

  const sendDataToBot = useCallback((data: any) => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.sendData === 'function') {
      tg.sendData(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return {
    isReady,
    isInTelegram,
    user,
    platform,
    colorScheme,
    startParam,
    triggerHaptic,
    openTelegramLink,
    openLink,
    closeMiniApp,
    sendDataToBot,
    webApp: window.Telegram?.WebApp
  };
}
