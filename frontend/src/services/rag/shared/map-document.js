/**
 * Map a RAG document row from the API (snake_case) to frontend shape (camelCase).
 */
export function mapDocumentFromApi(row) {
  if (!row) return null;

  return {
    documentId: row.document_id ?? row.documentId,
    title: row.title ?? '',
    mimeType: row.mime_type ?? row.mimeType ?? 'application/pdf',
    byteSize: Number(row.byte_size ?? row.byteSize ?? 0),
    status: row.status ?? 'processing',
    errorMessage: row.error_message ?? row.errorMessage ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
    userId: row.user_id ?? row.userId,
    storagePath: row.storage_path ?? row.storagePath,
  };
}
