import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

/**
 * Icon button that flips between light and dark via ThemeProvider.
 * Reusable in Navbar and public headers.
 */
export default function ThemeToggle({ className = '' }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type='button'
      className={`${styles.toggle} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun size={20} aria-hidden='true' />
      ) : (
        <Moon size={20} aria-hidden='true' />
      )}
    </button>
  );
}
