import { useEffect, useMemo, useState } from 'react'
import { PawPrint, Search, Plus, Heart, MapPin, X, Check, Dog, Cat, Bird, Rabbit, LoaderCircle, Trash2, Pencil, LogOut, LockKeyhole, Mail, UserRound } from 'lucide-react'

const API = 'http://localhost:5000/api/pets'
const AUTH_API = 'http://localhost:5000/api/auth'
const starterPets = [
  { _id: 'demo1', name: 'Milo', type: 'Dog', breed: 'Golden Retriever', age: 2, sex: 'Male', location: 'Pune, Maharashtra', status: 'Available', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85', description: 'A sunshine-loving goofball who enjoys walks, treats, and meeting new friends.' },
  { _id: 'demo2', name: 'Luna', type: 'Cat', breed: 'Domestic Shorthair', age: 1, sex: 'Female', location: 'Mumbai, Maharashtra', status: 'Available', image: 'https://images.unsplash.com/photo-1573865526739-10659b8504b9?auto=format&fit=crop&w=900&q=85', description: 'A gentle little explorer who loves cozy naps and a sunny window.' },
  { _id: 'demo3', name: 'Ollie', type: 'Dog', breed: 'Beagle', age: 3, sex: 'Male', location: 'Nagpur, Maharashtra', status: 'Available', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=900&q=85', description: 'Curious, kind, and always ready to sniff out a new adventure.' },
  { _id: 'demo4', name: 'Coco', type: 'Rabbit', breed: 'Mini Lop', age: 1, sex: 'Female', location: 'Pune, Maharashtra', status: 'Adopted', image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=900&q=85', description: 'A soft, quiet companion who likes gentle company and fresh greens.' },
  { _id: 'demo5', name: 'Pepper', type: 'Cat', breed: 'Tabby', age: 4, sex: 'Male', location: 'Nashik, Maharashtra', status: 'Available', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85', description: 'A confident cuddle expert with a playful side and a big purr.' },
  { _id: 'demo6', name: 'Daisy', type: 'Dog', breed: 'Indie', age: 2, sex: 'Female', location: 'Aurangabad, Maharashtra', status: 'Available', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=85', description: 'A sweet, smart friend who would love to be part of your family.' }
]
const blankForm = { name: '', type: 'Dog', breed: '', age: '', sex: 'Female', location: '', status: 'Available', image: '', description: '' }

function AnimalIcon({ type, size = 18 }) {
  const props = { size, strokeWidth: 1.8 }
  if (type === 'Cat') return <Cat {...props} />
  if (type === 'Bird') return <Bird {...props} />
  if (type === 'Rabbit') return <Rabbit {...props} />
  return <Dog {...props} />
}

function App() {
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('pawpal-session') || 'null') } catch { return null } })
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [pets, setPets] = useState([])
  const [connected, setConnected] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All pets')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [favorites, setFavorites] = useState([])

  async function loadPets() {
    try {
      const response = await fetch(API)
      if (!response.ok) throw new Error('API not ready')
      const data = await response.json()
      setPets(data)
      setConnected(true)
    } catch {
      setPets(starterPets)
      setConnected(false)
    }
  }
  useEffect(() => { if (session) loadPets() }, [session])

  async function submitAuth(event) {
    event.preventDefault(); setAuthBusy(true); setAuthError('')
    try {
      const response = await fetch(`${AUTH_API}/${authMode === 'signup' ? 'signup' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Authentication failed.')
      localStorage.setItem('pawpal-session', JSON.stringify(data)); setSession(data); setAuthForm({ name: '', email: '', password: '' })
    } catch (error) { setAuthError(error.message || 'Could not connect. Start the backend and MongoDB, then try again.') }
    finally { setAuthBusy(false) }
  }
  function logout() { localStorage.removeItem('pawpal-session'); setSession(null); setPets([]); setNotice('') }
  function authHeaders(extra = {}) { return { ...extra, Authorization: `Bearer ${session?.token}` } }

  const shownPets = useMemo(() => pets.filter(pet => {
    const searchMatch = `${pet.name} ${pet.breed} ${pet.location} ${pet.type}`.toLowerCase().includes(query.toLowerCase())
    const typeMatch = typeFilter === 'All pets' || pet.type === typeFilter
    const statusMatch = statusFilter === 'All' || pet.status === statusFilter
    return searchMatch && typeMatch && statusMatch
  }), [pets, query, typeFilter, statusFilter])

  function openAdd() { setEditing(null); setForm(blankForm); setModal(true) }
  function openEdit(pet) { setEditing(pet); setForm({ ...blankForm, ...pet, age: String(pet.age) }); setModal(true) }
  function change(field, value) { setForm(old => ({ ...old, [field]: value })) }

  async function savePet(event) {
    event.preventDefault()
    setBusy(true)
    const payload = { ...form, age: Number(form.age), image: form.image.trim() || `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=85` }
    try {
      const response = await fetch(editing ? `${API}/${editing._id}` : API, {
        method: editing ? 'PUT' : 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Could not save')
      await loadPets()
      setNotice(editing ? 'Pet details updated!' : 'Pet listing added!')
    } catch {
      if (connected) {
        setNotice('Could not save. Check that the backend and MongoDB are running.')
      } else if (editing) {
        setPets(old => old.map(p => p._id === editing._id ? { ...payload, _id: p._id } : p))
        setNotice('Demo updated in this browser only. Start the backend to save to MongoDB.')
      } else {
        setPets(old => [{ ...payload, _id: `demo-${Date.now()}` }, ...old])
        setNotice('Demo listing added in this browser only. Start the backend to save to MongoDB.')
      }
    }
    setBusy(false)
    setModal(false)
    setTimeout(() => setNotice(''), 5000)
  }

  async function removePet(pet) {
    if (!window.confirm(`Remove ${pet.name}'s listing?`)) return
    try {
      const response = await fetch(`${API}/${pet._id}`, { method: 'DELETE', headers: authHeaders() })
      if (!response.ok) throw new Error('Delete failed')
      await loadPets()
      setNotice('Listing removed.')
    } catch {
      setPets(old => old.filter(p => p._id !== pet._id))
      setNotice('Removed from the demo view. MongoDB changes require the backend to be running.')
    }
    setTimeout(() => setNotice(''), 5000)
  }

  async function toggleStatus(pet) {
    const nextStatus = pet.status === 'Available' ? 'Adopted' : 'Available'
    try {
      const response = await fetch(`${API}/${pet._id}`, {
        method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...pet, status: nextStatus })
      })
      if (!response.ok) throw new Error('Update failed')
      await loadPets()
      setNotice(`${pet.name} marked ${nextStatus.toLowerCase()}.`)
    } catch {
      setPets(old => old.map(p => p._id === pet._id ? { ...p, status: nextStatus } : p))
      setNotice('Status changed in the demo view. Start backend + MongoDB to save it.')
    }
    setTimeout(() => setNotice(''), 5000)
  }

  const availableCount = pets.filter(p => p.status === 'Available').length

  if (!session) return (
    <div className="auth-page">
      <div className="auth-art"><div className="auth-logo"><span className="brand-icon"><PawPrint size={23} fill="currentColor" /></span><span>Paw<span className="brand-accent">Pal</span></span></div><div className="auth-art-copy"><span className="auth-kicker">A LITTLE LOVE GOES A LONG WAY</span><h1>Every paw<br/>deserves a <em>place.</em></h1><p>Find a friend, share a little kindness, and help a pet find their forever home.</p><div className="auth-pets"><span>🐶</span><span>🐱</span><span>🐰</span><span>🐾</span></div></div><small className="auth-art-footer">MADE WITH LOVE FOR PETS EVERYWHERE</small></div>
      <div className="auth-panel"><div className="auth-card"><div className="auth-mobile-logo"><PawPrint size={22}/> PawPal</div><div className="eyebrow">WELCOME TO YOUR PET COMMUNITY</div><h2>{authMode === 'login' ? 'Welcome back!' : 'Join the family!'}</h2><p className="auth-subtitle">{authMode === 'login' ? 'Log in to continue making happy tails happen.' : 'Create an account and help pets find loving homes.'}</p><div className="auth-tabs"><button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => {setAuthMode('login');setAuthError('')}}>Log in</button><button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => {setAuthMode('signup');setAuthError('')}}>Sign up</button></div><form onSubmit={submitAuth} className="auth-form">{authMode === 'signup' && <label><span>Your name</span><div className="auth-input"><UserRound size={17}/><input autoComplete="name" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name" required /></div></label>}<label><span>Email address</span><div className="auth-input"><Mail size={17}/><input type="email" autoComplete="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com" required /></div></label><label><span>Password</span><div className="auth-input"><LockKeyhole size={17}/><input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={8} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 8 characters" required /></div></label>{authError && <div className="auth-error" role="alert">{authError}</div>}<button className="button button-dark auth-submit" disabled={authBusy}>{authBusy ? <LoaderCircle className="spin" size={17}/> : null}{authMode === 'login' ? 'Log in to PawPal' : 'Create my account'} <span>↗</span></button></form><div className="auth-note"><PawPrint size={15}/> Your next best friend could be one click away.</div></div><small className="auth-legal">By continuing, you agree to use PawPal kindly and responsibly.</small></div>
    </div>
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-icon"><PawPrint size={23} fill="currentColor" /></span><span>Paw<span className="brand-accent">Pal</span></span></a>
        <nav><a className="nav-active" href="#pets">Find a pet</a><a href="#how">How it works</a><a href="#footer">Our mission</a></nav>
        <div className="top-actions"><span className="welcome-user">Hi, {session.user?.name || 'friend'}!</span><button className="button button-outline logout-button" onClick={logout}><LogOut size={15}/> Log out</button><button className="button button-dark top-add" onClick={openAdd}><Plus size={17} /> Add a pet</button></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><PawPrint size={15} /> EVERY PET DESERVES A HOME</div>
            <h1>A little love.<br />A <span>forever</span> home.</h1>
            <p className="hero-text">Meet your new best friend. Browse lovely pets waiting for a safe, happy home — and make a difference that lasts a lifetime.</p>
            <div className="hero-actions"><a href="#pets" className="button button-dark">Meet the pets <span>↗</span></a><div className="happy-note"><span className="tiny-paws"><PawPrint size={18} /></span><span><b>{availableCount} pets</b><small>looking for a family</small></span></div></div>
            <div className="hero-trust"><span className="avatars"><i>🐶</i><i>🐱</i><i>🐰</i></span><span>Loved by pet people everywhere</span><span className="star">★★★★★</span></div>
          </div>
          <div className="hero-art">
            <div className="hero-blob"></div>
            <img className="hero-dog" src="https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=1000&q=90" alt="Happy dog waiting for a home" />
            <div className="floating-card"><span className="floating-heart"><Heart size={18} fill="currentColor" /></span><span><b>Find your soulmate</b><small>One paw at a time 🐾</small></span></div>
            <div className="doodle doodle-one">✳</div><div className="doodle doodle-two">✦</div>
          </div>
          <div className="hero-bottom-note">GOOD THINGS COME IN PAW-SOME PACKAGES <span>♡</span></div>
        </section>

        <section className="pet-section" id="pets">
          <div className="section-heading"><div><div className="eyebrow">YOUR NEW BEST FRIEND IS HERE</div><h2>Meet the <span>cuties</span></h2><p>Every face has a story. Maybe yours is next.</p></div><button className="button button-outline" onClick={openAdd}><Plus size={17} /> List a pet</button></div>
          <div className="filter-panel">
            <label className="search-box"><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, breed, or city..." /></label>
            <div className="filter-divider"></div>
            <div className="type-filters">{['All pets', 'Dog', 'Cat', 'Rabbit', 'Bird'].map(type => <button key={type} className={typeFilter === type ? 'filter-chip selected' : 'filter-chip'} onClick={() => setTypeFilter(type)}>{type !== 'All pets' && <AnimalIcon type={type} size={15} />}{type}</button>)}</div>
            <select aria-label="Filter adoption status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Available</option><option>Adopted</option></select>
          </div>
          {!connected && <div className="demo-banner"><span>●</span> Preview mode: showing sample pets. Start the backend and MongoDB to store your own listings permanently.</div>}
          <div className="results-line"><span>Showing <b>{shownPets.length}</b> adorable {shownPets.length === 1 ? 'pet' : 'pets'}</span><span className="sort-label">Made with love <Heart size={14} fill="currentColor" /></span></div>
          <div className="pet-grid">
            {shownPets.map((pet, index) => <article className="pet-card" key={pet._id}>
              <div className="pet-image-wrap"><img src={pet.image} alt={pet.name} onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=85' }} /><span className={`status-badge ${pet.status === 'Adopted' ? 'adopted' : ''}`}><span></span>{pet.status}</span><button className={`favorite-btn ${favorites.includes(pet._id) ? 'favorited' : ''}`} aria-label="Save pet" onClick={() => setFavorites(old => old.includes(pet._id) ? old.filter(id => id !== pet._id) : [...old, pet._id])}><Heart size={18} fill={favorites.includes(pet._id) ? 'currentColor' : 'none'} /></button><span className="image-number">0{index + 1}</span></div>
              <div className="pet-card-content"><div className="pet-name-line"><h3>{pet.name}</h3><span className="pet-type-icon"><AnimalIcon type={pet.type} size={18} /></span></div><p className="pet-breed">{pet.breed}</p><p className="pet-description">{pet.description || 'A sweet companion waiting for a loving home.'}</p><div className="pet-meta"><span>{pet.age} {Number(pet.age) === 1 ? 'year' : 'years'} old</span><span className="meta-dot">·</span><span>{pet.sex || 'Not specified'}</span></div><div className="pet-location"><MapPin size={14} /> {pet.location || 'Location not listed'}</div><div className="card-actions"><button className={pet.status === 'Available' ? 'adopt-button' : 'adopt-button is-adopted'} onClick={() => toggleStatus(pet)}>{pet.status === 'Available' ? 'Mark as adopted' : 'Mark available'} <span>↗</span></button><button className="icon-action" title="Edit listing" onClick={() => openEdit(pet)}><Pencil size={16} /></button><button className="icon-action delete-action" title="Delete listing" onClick={() => removePet(pet)}><Trash2 size={16} /></button></div></div>
            </article>)}
          </div>
          {shownPets.length === 0 && <div className="empty-state"><PawPrint size={34} /><h3>No pets found just yet</h3><p>Try another search or add a pet to the listing.</p><button className="button button-dark" onClick={openAdd}><Plus size={17} /> Add a pet</button></div>}
          <div className="listing-cta"><div className="cta-paw"><PawPrint size={29} /></div><div><h3>Know a pet who needs a home?</h3><p>Help them meet their human. Add their listing in just a minute.</p></div><button className="button button-dark" onClick={openAdd}>Add a pet <span>↗</span></button></div>
        </section>

        <section className="how-section" id="how"><div className="eyebrow">SIMPLE AS 1, 2, WOOF</div><h2>Love finds a <span>way.</span></h2><div className="steps"><div className="step"><div className="step-icon peach">⌕</div><span className="step-no">01</span><h3>Find your match</h3><p>Browse the adorable faces and discover a pet who fits your life.</p></div><div className="step"><div className="step-icon yellow">♡</div><span className="step-no">02</span><h3>Fall in love</h3><p>Learn about their age, breed, and story. Every pet has something special.</p></div><div className="step"><div className="step-icon green">⌂</div><span className="step-no">03</span><h3>Make it forever</h3><p>Update their adoption status and help them find their happy ending.</p></div></div></section>
      </main>

      <footer id="footer"><a className="brand footer-brand" href="#"><span className="brand-icon"><PawPrint size={22} fill="currentColor" /></span><span>Paw<span className="brand-accent">Pal</span></span></a><p>Small paws. Big love. Forever homes. ♡</p><span>Made with love for every animal, everywhere.</span></footer>

      {notice && <div className="toast"><Check size={17} /> {notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}><div className="pet-modal"><div className="modal-heading"><div><div className="eyebrow">{editing ? 'UPDATE A LISTING' : 'GIVE A PET A CHANCE'}</div><h2>{editing ? 'Edit pet details' : 'Add a new cutie'} <span>♡</span></h2><p>Tell everyone a little about this lovely pet.</p></div><button className="close-modal" onClick={() => setModal(false)}><X size={20} /></button></div><form onSubmit={savePet}>
        <div className="form-grid"><label>Pet name *<input required maxLength="60" value={form.name} onChange={e => change('name', e.target.value)} placeholder="e.g. Biscuit" /></label><label>Animal type *<select value={form.type} onChange={e => change('type', e.target.value)}>{['Dog', 'Cat', 'Rabbit', 'Bird', 'Other'].map(t => <option key={t}>{t}</option>)}</select></label><label>Breed *<input required value={form.breed} onChange={e => change('breed', e.target.value)} placeholder="e.g. Indie" /></label><label>Age (years) *<input required type="number" min="0" max="40" step="0.5" value={form.age} onChange={e => change('age', e.target.value)} placeholder="e.g. 2" /></label><label>Gender<select value={form.sex} onChange={e => change('sex', e.target.value)}><option>Female</option><option>Male</option><option>Not specified</option></select></label><label>Adoption status<select value={form.status} onChange={e => change('status', e.target.value)}><option>Available</option><option>Adopted</option></select></label><label className="full-field">City / location *<input required value={form.location} onChange={e => change('location', e.target.value)} placeholder="e.g. Pune, Maharashtra" /></label><label className="full-field">Photo URL (optional)<input type="url" value={form.image} onChange={e => change('image', e.target.value)} placeholder="https://example.com/pet-photo.jpg" /></label><label className="full-field">A little about this pet<textarea rows="3" maxLength="400" value={form.description} onChange={e => change('description', e.target.value)} placeholder="Personality, favourite things, and what makes them special..." /></label></div>
        <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModal(false)}>Cancel</button><button type="submit" className="button button-dark" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />}{editing ? 'Save changes' : 'Add listing'}</button></div>
      </form></div></div>}
    </div>
  )
}

export default App
