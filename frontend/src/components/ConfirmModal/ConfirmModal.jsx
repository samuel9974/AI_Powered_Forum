/**
 * Accessible confirmation dialog for destructive or irreversible actions.
 * Renders a centered panel over a dimmed backdrop; Escape and backdrop click cancel.
 */
import { useEffect, useId, useRef } from 'react';
import styles from './ConfirmModal.module.css';

/**
 * @param open - whether the modal is visible
 * @param title - dialog heading
 * @param message - supporting explanation
 * @param confirmLabel - primary action label (default "Confirm")
 * @param cancelLabel - secondary action label (default "Cancel")
 * @param confirmBusyLabel - primary label while confirmLoading is true
 * @param confirmLoading - disables actions and shows busy confirm label
 * @param tone - "danger" | "default" for the confirm button style
 * @param onConfirm - called when the user confirms
 * @param onCancel - called when the user cancels (backdrop, Escape, Cancel button)
 */
export default function ConfirmModal({
  open = false,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmBusyLabel = 'Working…',
  confirmLoading = false,
  tone = 'default',
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    const frame = requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = event => {
      if (event.key === 'Escape' && !confirmLoading) {
        event.preventDefault();
        onCancelRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (
        previouslyFocusedRef.current instanceof HTMLElement &&
        document.contains(previouslyFocusedRef.current)
      ) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open, confirmLoading]);

  if (!open) return null;

  const confirmClassName =
    tone === 'danger'
      ? `${styles.confirmModal__confirmBtn} ${styles['confirmModal__confirmBtn--danger']}`
      : styles.confirmModal__confirmBtn;

  return (
    <div className={styles.confirmModal}>
      <button
        type='button'
        className={styles.confirmModal__backdrop}
        aria-label='Close dialog'
        disabled={confirmLoading}
        onClick={() => {
          if (!confirmLoading) onCancel?.();
        }}
      />

      <div
        className={styles.confirmModal__panel}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <h2 id={titleId} className={styles.confirmModal__title}>
          {title}
        </h2>
        <p id={messageId} className={styles.confirmModal__message}>
          {message}
        </p>

        <div className={styles.confirmModal__actions}>
          <button
            type='button'
            ref={cancelRef}
            className={styles.confirmModal__cancelBtn}
            onClick={() => onCancel?.()}
            disabled={confirmLoading}
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            className={confirmClassName}
            onClick={() => onConfirm?.()}
            disabled={confirmLoading}
            aria-busy={confirmLoading || undefined}
          >
            {confirmLoading ? confirmBusyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
