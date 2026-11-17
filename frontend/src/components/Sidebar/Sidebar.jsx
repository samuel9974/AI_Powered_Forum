import { NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut,
  MessageSquare,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { ASK_QUESTION_PATH, NAV_ITEMS } from '../../config/navConfig';
import { useAuth } from '../../contexts/AuthContext';
import { userInitials } from '../../lib/utils';
import {
  SIDEBAR_PANEL_ID,
  useSidebar,
} from '../../contexts/SidebarContext';
import styles from './Sidebar.module.css';

/**
 * Primary navigation shell. Nav destinations come from `config/navConfig.js`
 * so Layout titles stay in sync when sections are added.
 * The AI assistant is opened from the top-bar “Ask AI” control.
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    collapsed,
    toggleCollapsed,
    mobileOpen,
    closeMobile,
    isMobile,
  } = useSidebar();

  // Icon-rail only on desktop. Mobile drawer always shows full labels.
  const iconRail = collapsed && !isMobile;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar';

  const go = path => {
    closeMobile();
    navigate(path);
  };

  return (
    <aside
      id={SIDEBAR_PANEL_ID}
      className={[
        styles.sidebar,
        iconRail ? styles['sidebar--collapsed'] : '',
        mobileOpen ? styles['sidebar--mobileOpen'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-collapsed={iconRail ? 'true' : 'false'}
      aria-hidden={isMobile && !mobileOpen ? true : undefined}
      aria-modal={isMobile && mobileOpen ? true : undefined}
      role={isMobile ? 'dialog' : undefined}
      aria-label={isMobile ? 'Navigation menu' : undefined}
    >
      <div className={styles.sidebar__header}>
        <div
          className={styles.sidebar__branding}
          onClick={() => go('/')}
          title='Evangadi Forum — go to landing'
          aria-label='Evangadi Forum — go to landing'
          role='button'
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              go('/');
            }
          }}
        >
          <div className={styles.sidebar__logo} aria-hidden>
            <MessageSquare className={styles['sidebar__logo-icon']} size={20} />
          </div>
          <div className={styles.sidebar__brandCopy} aria-hidden={iconRail}>
            <p className={styles.sidebar__title}>Evangadi Forum</p>
            <p className={styles.sidebar__tagline}>
              Learn together. Ask with context.
            </p>
          </div>
        </div>

        {!isMobile && (
          <button
            type='button'
            onClick={toggleCollapsed}
            className={styles.sidebar__toggle}
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-expanded={!collapsed}
            aria-controls={SIDEBAR_PANEL_ID}
            data-tooltip={toggleLabel}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} aria-hidden />
            ) : (
              <PanelLeftClose size={18} aria-hidden />
            )}
          </button>
        )}

        {isMobile && (
          <button
            type='button'
            onClick={closeMobile}
            className={styles.sidebar__toggle}
            aria-label='Close navigation menu'
            title='Close navigation menu'
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>

      <nav className={styles.sidebar__nav} aria-label='Main navigation'>
        <p className={styles.sidebar__navLabel} aria-hidden={iconRail}>
          Navigate
        </p>
        {NAV_ITEMS.map(item => (
          <div key={item.path} className={styles['sidebar__nav-item-wrapper']}>
            <NavLink
              to={item.path}
              title={item.label}
              aria-label={item.label}
              data-tooltip={item.label}
              onClick={closeMobile}
              className={({ isActive }) =>
                `${styles.sidebar__link} ${
                  isActive
                    ? styles['sidebar__link--active']
                    : styles['sidebar__link--inactive']
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    aria-hidden
                    className={`${styles.sidebar__icon} ${
                      isActive
                        ? styles['sidebar__icon--active']
                        : styles['sidebar__icon--inactive']
                    }`}
                  />
                  <span
                    className={styles.sidebar__linkLabel}
                    aria-hidden={iconRail}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      <div className={styles.sidebar__footer}>
        <button
          type='button'
          onClick={() => go(ASK_QUESTION_PATH)}
          className={styles.sidebar__button}
          title='New Question'
          aria-label='New Question'
          data-tooltip='New Question'
        >
          <Plus
            size={18}
            strokeWidth={2.25}
            aria-hidden
            className={styles.sidebar__buttonIcon}
          />
          <span className={styles.sidebar__buttonLabel}>New Question</span>
        </button>

        <div className={styles.sidebar__user}>
          <div
            className={styles.sidebar__profile}
            title={displayName}
            data-tooltip={displayName}
          >
            <div className={styles.sidebar__avatar} aria-hidden>
              {userInitials(user)}
            </div>
            <div className={styles.sidebar__info} aria-hidden={iconRail}>
              <p className={styles.sidebar__name}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={styles.sidebar__role}>Learner</p>
            </div>
          </div>

          <button
            type='button'
            onClick={() => {
              closeMobile();
              logout();
            }}
            className={styles.sidebar__logout}
            title='Logout'
            aria-label='Logout'
            data-tooltip='Logout'
          >
            <LogOut size={16} aria-hidden />
            <span className={styles.sidebar__logoutLabel}>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
