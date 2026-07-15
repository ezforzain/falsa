import { useEffect, useId, useRef, useState } from 'react';
import { validateDocumentFile } from '../lib/file';
import { IconAlertCircle, IconCheck, IconFile, IconTrash, IconUpload } from './icons';

// Reusable drag & drop file upload: click-or-drag to choose a file, a brief simulated
// "uploading" state (there's no real network upload in this mocked app, but the affordance
// still matters for the UX this spec asks for), an image thumbnail or generic file-icon
// preview, and remove/replace controls. Fully keyboard accessible — the drop zone is a real
// <label htmlFor> wrapping a native file input, so Tab+Enter/Space opens the picker for free.
export default function DragDropUpload({
  file,
  onFileChange,
  label,
  helpText = 'PDF, JPG, or PNG — up to 5MB',
  validate = validateDocumentFile,
  error,
  required = false,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const acceptFile = (candidate) => {
    const validationError = validate(candidate);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    setUploading(true);
    // Brief simulated processing delay so the upload animation / success check reads as real
    // feedback rather than an instant flicker — there's no actual network call to await here.
    setTimeout(() => {
      setUploading(false);
      onFileChange(candidate);
    }, 400);
  };

  const handleInputChange = (e) => {
    const chosen = e.target.files?.[0];
    if (chosen) acceptFile(chosen);
    e.target.value = ''; // allow re-selecting the same file after a remove
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  };

  const remove = () => {
    setLocalError(null);
    onFileChange(null);
  };

  const displayError = error || localError;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink-soft mb-2">
          {label} {required && <span className="text-orange">*</span>}
        </label>
      )}

      {!file ? (
        <label
          htmlFor={inputId}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 text-center px-5 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragActive ? 'border-orange bg-orange-tint' : displayError ? 'border-orange/60 bg-orange-tint/40' : 'border-border hover:border-orange hover:bg-orange-tint/30'
          }`}
        >
          {uploading ? (
            <>
              <span
                className="w-7 h-7 border-[2.5px] border-orange/25 rounded-full inline-block"
                style={{ borderTopColor: '#FF6A00', animation: 'spin 0.8s linear infinite' }}
              />
              <span className="text-[13px] font-medium text-text mt-1">Uploading…</span>
            </>
          ) : (
            <>
              <span className="w-11 h-11 rounded-full bg-orange-tint flex items-center justify-center text-orange">
                <IconUpload width="20" height="20" />
              </span>
              <span className="text-[13.5px] font-semibold text-ink">
                <span className="text-orange">Click to upload</span> or drag and drop
              </span>
              <span className="text-[11.5px] text-text-muted">{helpText}</span>
            </>
          )}
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleInputChange}
            className="sr-only"
            aria-describedby={displayError ? `${inputId}-error` : undefined}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white">
          {previewUrl ? (
            <img src={previewUrl} alt={file.name} className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
          ) : (
            <span className="w-14 h-14 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 text-text-muted">
              <IconFile width="22" height="22" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-green flex items-center justify-center shrink-0">
                <IconCheck width="9" height="9" strokeWidth="3.5" className="text-white" />
              </span>
              <span className="text-[13px] font-semibold text-ink truncate">{file.name}</span>
            </div>
            <span className="text-[11.5px] text-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB · Uploaded</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <label
              htmlFor={inputId}
              className="cursor-pointer text-[11.5px] font-semibold text-green hover:text-green-hover px-2.5 py-1.5 rounded-lg hover:bg-green-tint transition-colors"
            >
              Replace
              <input id={inputId} type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleInputChange} className="sr-only" />
            </label>
            <button
              type="button"
              onClick={remove}
              aria-label="Remove file"
              className="cursor-pointer text-text-muted hover:text-orange-text p-1.5 rounded-lg hover:bg-orange-tint transition-colors"
            >
              <IconTrash width="15" height="15" />
            </button>
          </div>
        </div>
      )}

      {displayError && (
        <p id={`${inputId}-error`} className="flex items-center gap-1.5 text-xs text-orange-text mt-2">
          <IconAlertCircle width="13" height="13" className="shrink-0" />
          {displayError}
        </p>
      )}
    </div>
  );
}
