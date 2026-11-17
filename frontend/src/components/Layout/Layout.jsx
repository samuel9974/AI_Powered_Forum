import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getPageMeta } from '../../config/navConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSession } from '../../contexts/ChatSessionContext';
import { useSidebar } from '../../contexts/SidebarContext';
import AssistantDrawer from '../AssistantDrawer/AssistantDrawer.jsx';
import Navbar from '../Navbar/Navbar.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import styles from './Layout.module.css';

/**
 * Authenticated shell: fixed sidebar + scrollable main column + footer.
 * On narrow viewports the sidebar becomes an off-canvas drawer.
 * Page titles come from `config/navConfig.js` (same source as Sidebar).
 * Ask AI docks as a persistent right rail and stays open across navigation.
 */
export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const { mobileOpen, closeMobile } = useSidebar();
  const { isDrawerOpen } = useChatSession();
  const { title } = getPageMeta(location.pathname);

  // Close the mobile nav drawer on navigation — not the Ask AI panel.
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  return (
    <div
      className={[
        styles.layout,
        isDrawerOpen ? styles['layout--assistantOpen'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Sidebar />

      {mobileOpen ? (
        <button
          type='button'
          className={styles.layout__overlay}
          onClick={closeMobile}
          aria-label='Close navigation menu'
        />
      ) : null}

      <div className={styles.layout__content}>
        <Navbar title={title} user={user} />
        <main className={styles.layout__main}>
          <div className={styles.layout__mainInner}>
            <Outlet />
          </div>
        </main>

        <footer className={styles.layout__footer}>
          <div className={styles['layout__footer-content']}>
            <div className={styles['layout__footer-branding']}>
              <h4 className={styles['layout__footer-title']}>Evangadi Forum</h4>
              <p className={styles['layout__footer-tagline']}>
                A practice space for technical Q&A, peer feedback, and
                AI-assisted search, built for Evangadi learners and mentors.
              </p>
              <p className={styles['layout__footer-copyright']}>
                © 2026 Evangadi Forum. For educational use.
              </p>
            </div>
          </div>
        </footer>
      </div>

      <AssistantDrawer />
    </div>
  );
}
