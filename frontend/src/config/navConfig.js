import { LayoutDashboard, MessageSquare, FileText } from 'lucide-react';

/**
 * Shell navigation + page chrome metadata.
 *
 * Single source of truth for:
 * - Sidebar primary links (`NAV_ITEMS`)
 * - Navbar title / subtitle (`getPageMeta`)
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
 * `label` = sidebar text; `title` / `subtitle` = Navbar chrome for that path.
 */
export const NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: 'Home',
    path: '/dashboard',
    title: 'Home',
    subtitle:
      'Browse the feed, search by keyword, or run AI similarity search.',
  },
  {
    icon: MessageSquare,
    label: 'Your Topics',
    path: '/my-questions',
    title: 'Your topics',
    subtitle:
      'Questions you have posted. Open any thread to read replies or edit context.',
  },
  {
    icon: FileText,
    label: 'Knowledge Base',
    path: '/rag-documents',
    title: 'Knowledge base',
    subtitle:
      'Private PDF library: reader, semantic search, and AI answers with citations per document.',
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
    subtitle:
      'A clear title and reproducible steps get faster, more accurate answers.',
  },
  {
    match: path =>
      path.startsWith('/questions/') && path !== ASK_QUESTION_PATH,
    title: 'Discussion',
    subtitle:
      'Read the thread, review related topics, and reply with markdown if you can help.',
  },
  {
    match: path => path === '/chatbot',
    title: 'Evangadi assistant',
    subtitle:
      'Ask about Evangadi programs and policies. Answers use the official knowledge base with citations.',
  },
];

/**
 * Resolve Navbar title/subtitle for the current location.
 * @param {string} pathname
 * @returns {{ title: string, subtitle: string }}
 */
export function getPageMeta(pathname) {
  const navItem = NAV_ITEMS.find(item => item.path === pathname);
  if (navItem) {
    return { title: navItem.title, subtitle: navItem.subtitle };
  }

  for (const page of EXTRA_PAGES) {
    if (page.match(pathname)) {
      return { title: page.title, subtitle: page.subtitle };
    }
  }

  return { title: 'Forum', subtitle: '' };
}
