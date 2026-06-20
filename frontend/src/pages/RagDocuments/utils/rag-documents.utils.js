export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function getStatusLabel(status) {
  if (status === 'ready') return 'READY';
  if (status === 'failed') return 'FAILED';
  if (status === 'processing') return 'PROCESSING';
  return (status || 'UNKNOWN').toUpperCase();
}

export function mergeDocumentUpdate(documents, updated) {
  return documents.map(document =>
    document.documentId === updated.documentId ? updated : document,
  );
}
