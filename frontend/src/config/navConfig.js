import { LayoutDashboard, MessageSquare, FileText } from 'lucide-react';

/**
 * Shell navigation + page chrome metadata.
 *
 * Single source of truth for:
 * - Sidebar primary links (`NAV_ITEMS`)
 * - Navbar title (`getPageMeta`)
 * - Ask CTA path (`ASK_QUESTION_PATH`)
 *
 * The AI assistant is opened from the top-bar “Ask AI” control (drawer),
 * not as a sidebar nav row.
 *
 * When you add a protected section:
 * 1. Add a `<Route>` in `App.jsx`
 * 2. Add a row here (sidebar item and/or EXTRA_PAGES meta)
 *    — do not duplicate path strings in Sidebar / Layout.
 */

/** CTA destination for "New Question". */
export const ASK_QUESTION_PATH = '/questions/ask';

/**
 * Primary sidebar navigation.
 * `label` = sidebar text; `title` = Navbar chrome for that path.
 */
export const NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: 'Home',
    path: '/dashboard',
    title: 'Home',
  },
  {
    icon: MessageSquare,
    label: 'Your Topics',
    path: '/my-questions',
    title: 'Your topics',
  },
  {
    icon: FileText,
    label: 'Knowledge Base',
    path: '/rag-documents',
    title: 'Knowledge base',
  },
];

/**
 * Chrome titles for routes that are not primary sidebar rows
 * (ask form, question detail, full-page assistant). Order matters — first match wins.
 */
const EXTRA_PAGES = [
  {
    match: path => path === ASK_QUESTION_PATH,
    title: 'Ask a question',
  },
  {
    match: path =>
      path.startsWith('/questions/') && path !== ASK_QUESTION_PATH,
    title: 'Discussion',
  },
  {
    match: path => path === '/chatbot',
    title: 'Evangadi assistant',
  },
];

/**
 * Resolve Navbar title for the current location.
 * @param {string} pathname
 * @returns {{ title: string }}
 */
export function getPageMeta(pathname) {
  const navItem = NAV_ITEMS.find(item => item.path === pathname);
  if (navItem) {
    return { title: navItem.title };
  }

  for (const page of EXTRA_PAGES) {
    if (page.match(pathname)) {
      return { title: page.title };
    }
  }

  return { title: 'Forum' };
}
