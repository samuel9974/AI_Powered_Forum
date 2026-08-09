/**
 * Opt-in RAG diagnostic logging. Enable with RAG_DIAGNOSTICS=1 in .env.
 * Does not change retrieval or answer behavior.
 */

export function isRagDiagnosticsEnabled() {
  const value = String(process.env.RAG_DIAGNOSTICS || "")
    .trim()
    .toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

/**
 * @param {string} label
 * @param {Record<string, unknown>} payload
 */
export function logRagDiagnostic(label, payload = {}) {
  if (!isRagDiagnosticsEnabled()) {
    return;
  }

  console.log(`[RAG_DIAG] ${label}`, JSON.stringify(payload));
}
