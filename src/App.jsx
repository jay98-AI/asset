import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header.jsx'
import SearchView from './components/SearchView.jsx'
import BrowseView from './components/BrowseView.jsx'
import DetailView from './components/DetailView.jsx'
import AdminView from './components/AdminView.jsx'
import { AddVersionModal, AdminLoginModal } from './components/Modals.jsx'
import { ASSET_TYPES, INITIAL_ASSETS } from './data/assets.js'
import { assetMatches, parseScenes, parseSearch, unique, usesFor } from './lib/assets.js'

const EMPTY_FORM = {
  project: '',
  newName: '',
  type: 'Character Sheet',
  name: '',
  scenes: '',
  version: '',
  characters: '',
  location: '',
  props: '',
  model: '',
  prompt: '',
}

const EMPTY_FACETS = { projects: [], episodes: [], scenes: [] }

function preferredTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem('asset-hub-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Theme preference remains temporary if the browser blocks storage.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function preferredSidebar() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('asset-hub-sidebar') === 'collapsed'
  } catch {
    return false
  }
}

export default function App() {
  const [assets, setAssets] = useState(INITIAL_ASSETS)
  const [view, setView] = useState('search')
  const [previousView, setPreviousView] = useState('search')
  const [isAdmin, setIsAdmin] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [facets, setFacets] = useState(EMPTY_FACETS)
  const [openFilter, setOpenFilter] = useState(null)
  const [selected, setSelected] = useState([])
  const [detailId, setDetailId] = useState(null)
  const [shownVersion, setShownVersion] = useState(null)
  const [browseProject, setBrowseProject] = useState('Moonlit Harbor')
  const [browseEpisode, setBrowseEpisode] = useState(1)
  const [browseScene, setBrowseScene] = useState(0)
  const [loginOpen, setLoginOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [targetEpisode, setTargetEpisode] = useState('')
  const [targetScene, setTargetScene] = useState('')
  const [deletePending, setDeletePending] = useState(false)
  const [versionModal, setVersionModal] = useState(false)
  const [versionFile, setVersionFile] = useState('')
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState(preferredTheme)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(preferredSidebar)
  const toastTimer = useRef(null)
  const nextAssetId = useRef(Math.max(0, ...INITIAL_ASSETS.map((asset) => asset.id)) + 1)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('asset-hub-theme', theme)
    } catch {
      // The selected theme still applies for this visit.
    }
  }, [theme])

  useEffect(() => {
    try {
      window.localStorage.setItem('asset-hub-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded')
    } catch {
      // The current layout still changes if browser storage is unavailable.
    }
  }, [sidebarCollapsed])

  const detailAsset = assets.find((asset) => asset.id === detailId) ?? assets[0]
  const parsedSearch = useMemo(() => parseSearch(query), [query])
  const results = useMemo(
    () => assets.filter((asset) => assetMatches(asset, parsedSearch.filters, type, facets)),
    [assets, facets, parsedSearch, type],
  )
  const projects = useMemo(() => unique(assets.map((asset) => asset.project)).sort(), [assets])
  const allUses = useMemo(() => assets.flatMap(usesFor), [assets])
  const filterOptions = useMemo(() => ({
    projects: projects.map((project) => ({ value: project, label: project })),
    episodes: unique(allUses.map((use) => use.ep)).sort((a, b) => a - b).map((episode) => ({ value: episode, label: `Episode ${episode}` })),
    scenes: unique(allUses.map((use) => use.sc).filter(Boolean)).sort((a, b) => a - b).map((scene) => ({ value: scene, label: `Scene ${scene}` })),
  }), [allUses, projects])

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }

  function navigate(nextView) {
    setView(nextView)
    setOpenFilter(null)
    if (nextView !== 'detail') setDetailId(null)
  }

  function openAsset(id) {
    setPreviousView(view)
    setDetailId(id)
    setShownVersion(null)
    setTargetEpisode('')
    setTargetScene('')
    setDeletePending(false)
    setView('detail')
  }

  function toggleSelection(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function toggleFacet(key, value) {
    setFacets((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }))
  }

  function clearAllFilters() {
    setFacets(EMPTY_FACETS)
    setType('All')
    setOpenFilter(null)
  }

  function handleAdmin() {
    if (isAdmin) return
    setPassword('')
    setPasswordError('')
    setLoginOpen(true)
  }

  function unlockAdmin() {
    if (password !== 'admin123') {
      setPasswordError('Incorrect password')
      return
    }
    setIsAdmin(true)
    setLoginOpen(false)
    setPassword('')
    setView('admin')
    notify('Admin workspace unlocked')
  }

  function returnToMember() {
    setIsAdmin(false)
    if (view === 'admin') setView('search')
  }

  function updateAsset(id, update) {
    setAssets((current) => current.map((asset) => asset.id === id ? update(asset) : asset))
  }

  function linkScene() {
    const episodeText = String(targetEpisode).trim()
    const sceneText = String(targetScene).trim()
    if (!episodeText) return notify('Enter a target episode')
    if (!/^\d+$/.test(episodeText)) return notify('Enter a whole-number episode')
    if (sceneText && !/^\d+$/.test(sceneText)) return notify('Enter a whole-number scene, or leave it blank')
    const episode = Number(episodeText)
    const scene = sceneText ? Number(sceneText) : 0
    if (usesFor(detailAsset).some((use) => use.ep === episode && use.sc === scene)) return notify('Asset is already linked there')
    updateAsset(detailAsset.id, (asset) => ({ ...asset, also: [...(asset.also ?? []), { ep: episode, sc: scene }] }))
    notify(`Linked to Episode ${episode}${scene ? `, Scene ${scene}` : ''}`)
  }

  function removeUse(index) {
    const remaining = usesFor(detailAsset).filter((_, itemIndex) => itemIndex !== index)
    if (!remaining.length) return notify('An asset needs at least one episode or scene')
    updateAsset(detailAsset.id, (asset) => ({ ...asset, ep: remaining[0].ep, sc: remaining[0].sc, also: remaining.slice(1) }))
  }

  function deleteAsset() {
    if (!deletePending) {
      setDeletePending(true)
      return
    }
    const remaining = assets.filter((asset) => asset.id !== detailAsset.id)
    setAssets(remaining)
    setSelected((current) => current.filter((id) => id !== detailAsset.id))
    setDeletePending(false)
    notify('Asset deleted')
    if (!remaining.length) {
      setView('search')
      return
    }
    setView(previousView === 'detail' ? 'search' : previousView)
  }

  function chooseVersionFile() {
    const extension = detailAsset.type === 'Voice-over' ? 'wav' : ['Script', 'Storyboard'].includes(detailAsset.type) ? 'pdf' : 'png'
    setVersionFile(`${detailAsset.name.replace(/ – /g, '_').replace(/\s+/g, '_')}_v${detailAsset.ver + 1}.${extension}`)
  }

  function uploadVersion() {
    const nextVersion = detailAsset.ver + 1
    updateAsset(detailAsset.id, (asset) => ({ ...asset, ver: nextVersion }))
    setShownVersion(null)
    setVersionFile('')
    setVersionModal(false)
    notify(`Version ${nextVersion} uploaded`)
  }

  function publishAsset() {
    const project = form.project === '__new' ? form.newName.trim() : form.project
    const sceneUses = parseScenes(form.scenes)
    if (!project) return notify('Select a project or enter a new project name')
    if (!form.name.trim() || !sceneUses.length) return notify('Add an asset name and a valid episode or scene')
    if (form.type === 'Script' && Number(form.version) < 1) return notify('Enter the script version number')

    const split = (value) => value.split(',').map((item) => item.trim()).filter(Boolean)
    const asset = {
      id: nextAssetId.current++,
      project,
      name: form.name.trim(),
      type: form.type,
      ep: sceneUses[0].ep,
      sc: sceneUses[0].sc,
      also: sceneUses.slice(1),
      chars: split(form.characters),
      loc: form.location.trim(),
      props: split(form.props),
      ver: form.type === 'Script' ? Number(form.version) : 1,
      model: form.model.trim(),
      prompt: form.prompt.trim(),
    }
    setAssets((current) => [asset, ...current])
    setForm(EMPTY_FORM)
    notify('Asset published')
  }

  return (
    <div className={sidebarCollapsed ? 'app sidebar-collapsed' : 'app'}>
      <Header
        view={view}
        isAdmin={isAdmin}
        theme={theme}
        sidebarCollapsed={sidebarCollapsed}
        onThemeToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        onSidebarToggle={() => setSidebarCollapsed((current) => !current)}
        onNavigate={navigate}
        onMember={returnToMember}
        onAdmin={handleAdmin}
      />

      {view === 'search' && (
        <SearchView
          query={query}
          onQuery={setQuery}
          chips={parsedSearch.chips}
          assets={results}
          selected={selected}
          onSelect={toggleSelection}
          onOpen={openAsset}
          filters={facets}
          filterOptions={filterOptions}
          openFilter={openFilter}
          onOpenFilter={(key) => setOpenFilter((current) => current === key ? null : key)}
          onToggleFilter={toggleFacet}
          onClearFilter={(key) => setFacets((current) => ({ ...current, [key]: [] }))}
          onClearAll={clearAllFilters}
          onResetSearch={() => { setQuery(''); clearAllFilters() }}
          types={ASSET_TYPES}
          type={type}
          onType={setType}
          onClearSelection={() => setSelected([])}
          onDownloadSelection={() => { notify(`Preparing ${selected.length} assets as assets.zip`); setSelected([]) }}
        />
      )}

      {view === 'browse' && (
        <BrowseView
          assets={assets}
          project={browseProject}
          episode={browseEpisode}
          scene={browseScene}
          type={type}
          types={ASSET_TYPES}
          onProject={(project) => { setBrowseProject(project); setBrowseEpisode(1); setBrowseScene(0) }}
          onEpisode={(episode) => { setBrowseEpisode(episode); setBrowseScene(0) }}
          onScene={setBrowseScene}
          onType={setType}
          onOpen={openAsset}
        />
      )}

      {view === 'detail' && detailAsset && (
        <DetailView
          asset={detailAsset}
          shownVersion={Math.min(shownVersion ?? detailAsset.ver, detailAsset.ver)}
          isAdmin={isAdmin}
          targetEpisode={targetEpisode}
          targetScene={targetScene}
          deletePending={deletePending}
          onBack={() => setView(previousView === 'detail' ? 'search' : previousView)}
          onVersion={setShownVersion}
          onDownload={(version) => notify(`Downloading ${detailAsset.name} v${version}`)}
          onAddVersion={() => { setVersionFile(''); setVersionModal(true) }}
          onTargetEpisode={setTargetEpisode}
          onTargetScene={setTargetScene}
          onLink={linkScene}
          onRemoveUse={removeUse}
          onDelete={deleteAsset}
        />
      )}

      {view === 'admin' && isAdmin && (
        <AdminView
          form={form}
          projects={projects}
          types={ASSET_TYPES}
          assets={assets}
          onField={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
          onPublish={publishAsset}
          onOpen={openAsset}
        />
      )}

      {loginOpen && (
        <AdminLoginModal
          password={password}
          error={passwordError}
          onPassword={(value) => { setPassword(value); setPasswordError('') }}
          onSubmit={unlockAdmin}
          onClose={() => setLoginOpen(false)}
        />
      )}

      {versionModal && detailAsset && (
        <AddVersionModal
          asset={detailAsset}
          file={versionFile}
          onFile={chooseVersionFile}
          onUpload={uploadVersion}
          onClose={() => setVersionModal(false)}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
