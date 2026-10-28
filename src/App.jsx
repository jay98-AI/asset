import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header.jsx'
import SearchView from './components/SearchView.jsx'
import BrowseView from './components/BrowseView.jsx'
import DetailView from './components/DetailView.jsx'
import AdminView from './components/AdminView.jsx'
import { AddVersionModal, AdminLoginModal } from './components/Modals.jsx'
import { ASSET_TYPES, INITIAL_ASSETS } from './data/assets.js'
import { assetMatches, parseScenes, parseSearch, unique, usesFor } from './lib/assets.js'
import { createReviewDemo, decideReview, memberAsset, reviewFor, startReview } from './lib/reviews.js'
import { RejectDialog, ReviewItem, ReviewQueue, ReviewThread } from './components/ReviewUI.jsx'

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
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = window.localStorage.getItem('asset-hub-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Theme preference remains temporary if the browser blocks storage.
  }
  return 'light'
}

export default function App() {
  const [assets, setAssets] = useState(() => INITIAL_ASSETS.map((asset) => asset.id === 3 ? { ...asset, ver: 2 } : asset))
  const [view, setView] = useState('search')
  const [previousView, setPreviousView] = useState('search')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuper, setIsSuper] = useState(false)
  const [requestedRole, setRequestedRole] = useState('admin')
  const [reviewState, setReviewState] = useState(createReviewDemo)
  const [reviewTab, setReviewTab] = useState('Waiting')
  const [rejectOpen, setRejectOpen] = useState(false)
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
  const [viewMode, setViewMode] = useState('grid')
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

  const role = isSuper ? 'super' : isAdmin ? 'admin' : 'member'
  const libraryAssets = useMemo(() => isAdmin ? assets.map((asset) => ({ ...asset, reviewStatus: reviewFor(asset, reviewState.reviews).status })) : assets.map((asset) => memberAsset(asset, reviewState.reviews)).filter(Boolean), [assets, isAdmin, reviewState.reviews])
  const rawDetail = assets.find((asset) => asset.id === detailId) ?? assets[0]
  const detailAsset = isAdmin ? rawDetail : rawDetail && memberAsset(rawDetail, reviewState.reviews)
  const parsedSearch = useMemo(() => parseSearch(query), [query])
  const results = useMemo(
    () => libraryAssets.filter((asset) => assetMatches(asset, parsedSearch.filters, type, facets)),
    [libraryAssets, facets, parsedSearch, type],
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

  function addNotification(to, kind, text, assetId) {
    setReviewState((state) => ({ ...state, notifications: [{ id: crypto.randomUUID(), to, kind, text, assetId, unread: true, time: 'Just now' }, ...state.notifications] }))
  }

  function recordEdit(text, assetId) {
    const message = `${isSuper ? 'Dev' : 'Riya'} ${text}`
    setReviewState((state) => ({ ...state, edits: [{ id: crypto.randomUUID(), text: message, assetId, time: 'Just now' }, ...state.edits] }))
    if (!isSuper) addNotification('super', 'edit', message, assetId)
  }

  function submitForReview(asset, previous, fileName) {
    setReviewState((state) => ({ ...state, reviews: { ...state.reviews, [asset.id]: startReview(asset, previous, role, fileName) } }))
    if (!isSuper) addNotification('super', 'upload', `Riya uploaded ${previous ? `version ${asset.ver} of ` : ''}${asset.name}`, asset.id)
  }

  function openReview(id) {
    if (!isSuper) return
    if (!assets.some((asset) => asset.id === id)) return notify('This asset is no longer in the library')
    setDetailId(id)
    setShownVersion(null)
    setView('review-item')
  }

  function reviewDecision(status, note = '') {
    if (!isSuper || !detailAsset) return
    const current = reviewFor(detailAsset, reviewState.reviews)
    if (current.status !== 'waiting' || (status === 'rejected' && !note.trim())) return
    setReviewState((state) => ({ ...state, reviews: { ...state.reviews, [detailAsset.id]: decideReview(current, detailAsset, status, note) } }))
    addNotification('admin', status === 'approved' ? 'approve' : 'reject', `Dev ${status === 'approved' ? 'approved' : 'marked'} ${detailAsset.name} version ${detailAsset.ver}${status === 'rejected' ? ' not approved. Open it to read the note.' : ''}`, detailAsset.id)
    setRejectOpen(false)
    setView('review')
    notify(status === 'approved' ? `Approved ${detailAsset.name}. Riya has been notified.` : `Note sent to Riya. Version ${detailAsset.ver} is hidden from members.`)
  }

  function replyToReview(text) {
    if (!isAdmin || !detailAsset || !text.trim()) return
    setReviewState((state) => {
      const current = reviewFor(detailAsset, state.reviews)
      return { ...state, reviews: { ...state.reviews, [detailAsset.id]: { ...current, round: current.round || 1, entries: [...current.entries, { round: current.round || 1, kind: 'reply', who: isSuper ? 'Dev' : 'Riya', time: 'Just now', text: text.trim() }] } } }
    })
    addNotification(isSuper ? 'admin' : 'super', 'reply', `${isSuper ? 'Dev' : 'Riya'} replied on ${detailAsset.name}`, detailAsset.id)
    notify('Reply sent')
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

  function handleAdmin(nextRole = 'admin') {
    setRequestedRole(nextRole)
    if (isAdmin) {
      setIsSuper(nextRole === 'super')
      setView(nextRole === 'super' ? 'review' : 'admin')
      setDetailId(null)
      return
    }
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
    setIsSuper(requestedRole === 'super')
    setLoginOpen(false)
    setPassword('')
    setView(requestedRole === 'super' ? 'review' : 'admin')
    notify('Admin workspace unlocked')
  }

  function returnToMember() {
    setIsAdmin(false)
    setIsSuper(false)
    setView('search')
    setSelected([])
    setDetailId(null)
    setRejectOpen(false)
    setVersionModal(false)
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
    recordEdit(`linked ${detailAsset.name} to Episode ${episode}${scene ? ` · Scene ${scene}` : ''}`, detailAsset.id)
    notify(`Linked to Episode ${episode}${scene ? `, Scene ${scene}` : ''}`)
  }

  function removeUse(index) {
    const remaining = usesFor(detailAsset).filter((_, itemIndex) => itemIndex !== index)
    if (!remaining.length) return notify('An asset needs at least one episode or scene')
    updateAsset(detailAsset.id, (asset) => ({ ...asset, ep: remaining[0].ep, sc: remaining[0].sc, also: remaining.slice(1) }))
    recordEdit(`updated scene links on ${detailAsset.name}`, detailAsset.id)
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
    submitForReview({ ...detailAsset, ver: nextVersion }, reviewFor(detailAsset, reviewState.reviews), versionFile)
    updateAsset(detailAsset.id, (asset) => ({ ...asset, ver: nextVersion }))
    setShownVersion(null)
    setVersionFile('')
    setVersionModal(false)
    notify(isSuper ? `Version ${nextVersion} uploaded and automatically approved` : `Version ${nextVersion} uploaded · sent for review`)
  }

  function publishAsset(fileName = '') {
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
    submitForReview(asset, undefined, fileName)
    setForm(EMPTY_FORM)
    notify(isSuper ? 'Asset published · automatically approved' : 'Asset published · waiting for review')
    return true
  }

  return (
    <div className="app">
      <Header
        view={view}
        isAdmin={isAdmin}
        role={role}
        waitingCount={assets.filter((asset) => reviewFor(asset, reviewState.reviews).status === 'waiting').length}
        notifications={reviewState.notifications.filter((item) => item.to === role)}
        onReadAll={() => setReviewState((state) => ({ ...state, notifications: state.notifications.map((item) => item.to === role ? { ...item, unread: false } : item) }))}
        onNotification={(item) => {
          setReviewState((state) => ({ ...state, notifications: state.notifications.map((note) => note.id === item.id ? { ...note, unread: false } : note) }))
          if (!assets.some((asset) => asset.id === item.assetId)) return notify('This asset is no longer in the library')
          if (isSuper && reviewFor(assets.find((asset) => asset.id === item.assetId), reviewState.reviews).status === 'waiting') openReview(item.assetId)
          else openAsset(item.assetId)
        }}
        theme={theme}
        onThemeToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        onNavigate={navigate}
        onMember={returnToMember}
        onAdmin={() => handleAdmin('admin')}
        onSuper={() => handleAdmin('super')}
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
          viewMode={viewMode}
          onViewMode={setViewMode}
        />
      )}

      {view === 'browse' && (
        <BrowseView
          assets={libraryAssets}
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
          onCancelDelete={() => setDeletePending(false)}
          reviewStatus={isAdmin ? reviewFor(detailAsset, reviewState.reviews).status : undefined}
          onEdit={(name, tags) => {
            if (!name) return notify('Enter an asset name')
            updateAsset(detailAsset.id, (asset) => ({ ...asset, name, chars: tags.split(',').map((tag) => tag.trim()).filter(Boolean) }))
            recordEdit(`edited name or tags on ${detailAsset.name}`, detailAsset.id)
            notify('Changes saved')
          }}
          reviewThread={isAdmin && <ReviewThread key={detailAsset.id} asset={detailAsset} review={reviewFor(detailAsset, reviewState.reviews)} role={role} onReply={replyToReview} onCorrect={() => { setVersionFile(''); setVersionModal(true) }} />}
        />
      )}

      {view === 'review' && isSuper && <ReviewQueue assets={assets} reviews={reviewState.reviews} edits={reviewState.edits} tab={reviewTab} onTab={setReviewTab} onOpen={openReview} />}
      {view === 'review-item' && isSuper && detailAsset && <ReviewItem asset={detailAsset} review={reviewFor(detailAsset, reviewState.reviews)} onBack={() => setView('review')} onApprove={() => reviewDecision('approved')} onReject={() => setRejectOpen(true)} onReply={replyToReview} />}
      {rejectOpen && isSuper && detailAsset && <RejectDialog asset={detailAsset} onClose={() => setRejectOpen(false)} onSubmit={(note) => reviewDecision('rejected', note)} />}

      {view === 'admin' && isAdmin && (
        <AdminView
          form={form}
          projects={projects}
          types={ASSET_TYPES}
          assets={libraryAssets}
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
