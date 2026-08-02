import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

/** localStorage key for the desktop collapsed preference. */
export const SIDEBAR_STORAGE_KEY = 'forum-sidebar-collapsed';

/** DOM id for the sidebar panel — used by aria-controls on toggle controls. */
export const SIDEBAR_PANEL_ID = 'app-sidebar';

/**
 * Mobile shell breakpoint. Must stay in sync with CSS media queries in
 * Layout / Sidebar / Navbar modules (`max-width: 899px`).
 */
export const SIDEBAR_MOBILE_QUERY = '(max-width: 899px)';

/**
 * Sidebar Context: shared shell state for Layout, Sidebar, and Navbar.
 * - `collapsed`: desktop icon-rail preference (persisted)
 * - `mobileOpen`: off-canvas drawer on narrow viewports (session only)
 */
const SidebarContext = createContext(undefined);

/**
 * Reads a stored collapsed preference; defaults to expanded (`false`).
 * @returns {boolean}
 */
function getStoredCollapsed() {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // localStorage can throw in private browsing / restricted contexts
  }
  return false;
}

/**
 * Expose desktop shell mode on <html> so CSS can resize the rail + content offset.
 * Mobile drawer does not use this attribute — it uses `mobileOpen` + CSS media queries.
 * @param {boolean} collapsed
 */
function applySidebarToDocument(collapsed) {
  document.documentElement.setAttribute(
    'data-sidebar',
    collapsed ? 'collapsed' : 'expanded',
  );
}

/**
 * @returns {boolean}
 */
function getIsMobileMatch() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(SIDEBAR_MOBILE_QUERY).matches;
}

/**
 * SidebarProvider owns desktop collapse + mobile drawer for the authenticated shell.
 */
export function SidebarProvider({ children }) {
  const [collapsed, setCollapsedState] = useState(() => getStoredCollapsed());
  const [mobileOpen, setMobileOpenState] = useState(false);
  const [isMobile, setIsMobile] = useState(() => getIsMobileMatch());

  // Persist desktop collapse + sync data-sidebar on <html>.
  useEffect(() => {
    applySidebarToDocument(collapsed);

    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore write failures; in-memory state still works for the session.
    }
  }, [collapsed]);

  // Track mobile breakpoint; close the drawer when returning to desktop.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia(SIDEBAR_MOBILE_QUERY);
    const onChange = event => {
      setIsMobile(event.matches);
      if (!event.matches) {
        setMobileOpenState(false);
      }
    };

    setIsMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Body scroll lock while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setMobileOpenState(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  /**
   * Sets an explicit collapsed state (desktop icon rail).
   * @param {boolean} nextCollapsed
   */
  const setCollapsed = useCallback(nextCollapsed => {
    setCollapsedState(Boolean(nextCollapsed));
  }, []);

  /** Flips between expanded and collapsed (desktop). */
  const toggleCollapsed = useCallback(() => {
    setCollapsedState(current => !current);
  }, []);

  /**
   * Sets mobile drawer open/closed.
   * @param {boolean} nextOpen
   */
  const setMobileOpen = useCallback(nextOpen => {
    setMobileOpenState(Boolean(nextOpen));
  }, []);

  /** Flips the mobile drawer. */
  const toggleMobileOpen = useCallback(() => {
    setMobileOpenState(current => !current);
  }, []);

  /** Closes the mobile drawer (route change, backdrop, Escape, nav click). */
  const closeMobile = useCallback(() => {
    setMobileOpenState(false);
  }, []);

  const value = {
    /** Whether the desktop sidebar is in icon-rail mode. */
    collapsed,
    setCollapsed,
    toggleCollapsed,
    /** Whether the mobile off-canvas drawer is open. */
    mobileOpen,
    setMobileOpen,
    toggleMobileOpen,
    closeMobile,
    /** True when viewport matches the mobile shell breakpoint. */
    isMobile,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

/**
 * Custom hook to access sidebar shell state.
 * @throws {Error} If used outside of SidebarProvider
 */
export function useSidebar() {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
}
