'use client';

import { useId, useRef, useState, type DragEvent } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';

interface Props {
  label?: string;
  hint?: string;
  accept?: string;
  previewUrl?: string | null;
  loading?: boolean;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
}

export default function FileUpload({
  label,
  hint = 'Arraste uma imagem ou clique pra escolher',
  accept = 'image/*',
  previewUrl,
  loading = false,
  disabled = false,
  onFileSelect,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelect(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled || loading) return;
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div
        className={`ui-file-drop${dragging ? ' ui-file-drop-active' : ''}${disabled || loading ? ' ui-file-drop-disabled' : ''}`}
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        onClick={() => !disabled && !loading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !disabled && !loading) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !loading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Pré-visualização" className="ui-file-drop-preview" />
        ) : (
          <ImageUp className="ui-file-drop-icon" size={28} aria-hidden="true" />
        )}
        <p className="ui-file-drop-hint">{loading ? 'Enviando...' : hint}</p>
        {loading && <Loader2 className="ui-file-drop-spinner" size={18} aria-hidden="true" />}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled || loading}
          className="ui-file-drop-input"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </div>
  );
}
