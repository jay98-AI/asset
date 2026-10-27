export function AdminLoginModal({ password, error, onPassword, onSubmit, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="admin-login-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-icon">⌁</div>
        <h2 id="admin-login-title">Admin access</h2>
        <p>Enter the admin password to upload and manage assets.</p>
        <label><span>Password</span><input className={error ? 'has-error' : ''} type="password" value={password} onChange={(event) => onPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onSubmit()} autoFocus aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? 'admin-login-error' : undefined} /></label>
        <div className="field-error" id="admin-login-error" role="alert">{error}</div>
        <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={onSubmit}>Unlock</button></div>
        <small>Prototype password: admin123</small>
      </div>
    </div>
  )
}

export function AddVersionModal({ asset, file, onFile, onUpload, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal version-modal" role="dialog" aria-modal="true" aria-labelledby="version-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-kicker">New version</div>
        <h2 id="version-title">{asset.name}</h2>
        <p>This will become V{asset.ver + 1}. Older versions remain available.</p>
        <button className={`drop-zone small ${file ? 'has-file' : ''}`} onClick={onFile}>
          <span className="upload-icon" aria-hidden="true">
            {file ? <svg viewBox="0 0 16 16" focusable="false"><path d="m3.5 8 3 3 6-6" /></svg> : <svg viewBox="0 0 16 16" focusable="false"><path d="M8 12V3m0 0L4.5 6.5M8 3l3.5 3.5M3 13h10" /></svg>}
          </span>
          <strong>{file || 'Choose a file'}</strong>
          <small>{file ? 'Ready to upload' : 'Click to simulate file selection'}</small>
        </button>
        <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button>{file && <button className="primary-button" onClick={onUpload}>Upload V{asset.ver + 1}</button>}</div>
      </div>
    </div>
  )
}
