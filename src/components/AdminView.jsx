export default function AdminView({ form, projects, types, assets, onField, onPublish, onOpen }) {
  const input = (field, placeholder, props = {}) => (
    <input value={form[field]} onChange={(event) => onField(field, event.target.value)} placeholder={placeholder} {...props} />
  )

  return (
    <main className="page-shell admin-view">
      <section className="admin-intro">
        <div>
          <div className="eyebrow">Admin workspace</div>
          <h1 aria-label="Upload and manage">Upload approved asset</h1>
          <p>Publish approved assets, add metadata, and maintain version history.</p>
        </div>
        <div className="admin-count"><strong>{assets.length}</strong><span>active assets</span></div>
      </section>

      <div className="admin-layout">
        <section className="upload-card">
          <div className="section-heading"><div><span>01</span><h2>Upload asset</h2></div><small>Fields marked * are required</small></div>
          <div className="drop-zone is-pending">
            <span className="upload-icon" aria-hidden="true">↑</span>
            <strong>Drop file here or browse</strong>
            <small>Choose the file before publishing its metadata</small>
          </div>

          <div className="form-grid">
            <label><span>Project *</span><select value={form.project} onChange={(event) => onField('project', event.target.value)}><option value="">Select project…</option>{projects.map((project) => <option key={project}>{project}</option>)}<option value="__new">+ Add new project</option></select></label>
            {form.project === '__new' && <label><span>New project name *</span>{input('newName', 'Enter project name')}</label>}
            <label><span>Asset type *</span><select value={form.type} onChange={(event) => onField('type', event.target.value)}>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="full"><span>Asset name *</span>{input('name', 'e.g. Arjun – Character Sheet')}</label>
            <label className="full"><span>{form.type === 'Script' ? 'Episode *' : 'Scenes *'}</span>{input('scenes', form.type === 'Script' ? 'e.g. ep01' : 'e.g. ep01 sc03, ep04 sc05')}</label>
            {form.type === 'Script' && <label><span>Version *</span>{input('version', 'e.g. 5', { type: 'number', min: 1 })}</label>}
            <div className="form-note full">For multiple scenes, separate entries with commas. The first becomes the home scene.</div>
            <label><span>Characters</span>{input('characters', 'Comma separated')}</label>
            <label><span>Location</span>{input('location', 'e.g. Harbor')}</label>
            <label className="full"><span>Props</span>{input('props', 'Comma separated')}</label>
            <label><span>AI model</span>{input('model', 'Optional')}</label>
            <label className="full"><span>Prompt</span><textarea value={form.prompt} onChange={(event) => onField('prompt', event.target.value)} placeholder="Optional generation prompt" /></label>
          </div>
          <button className="primary-button publish-button" onClick={onPublish}>Publish asset <span>→</span></button>
        </section>

        <section className="manage-card">
          <div className="section-heading"><div><span>02</span><h2>Manage assets</h2></div><small>{assets.length} total</small></div>
          <p>Open an asset to manage its versions and scene links.</p>
          <div className="manage-list">
            {assets.map((asset) => (
              <button key={asset.id} onClick={() => onOpen(asset.id)}>
                <span className="manage-monogram">{asset.type.slice(0, 1)}</span>
                <span className="manage-details"><strong>{asset.name}</strong><small>{asset.type} · Ep {asset.ep}{asset.sc ? ` / Sc ${asset.sc}` : ''}</small></span>
                <span className="manage-version">v{asset.ver}</span>
                <span className="manage-arrow">→</span>
              </button>
            ))}
          </div>
          <footer><span>Admin seats</span><strong>3 of 3</strong><small>Anika R. · Dev M. · Sara K.</small></footer>
        </section>
      </div>
    </main>
  )
}
