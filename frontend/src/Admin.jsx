import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  FileText,
  Image,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { profile } from './data.js';
import './admin.css';

async function getCsrfToken() {
  const response = await fetch('/api/auth/csrf');
  if (!response.ok) throw new Error('Could not start a secure session. Check that the backend is running.');
  return (await response.json()).token;
}

async function requestJson(url, options = {}, csrfToken) {
  const headers = new Headers(options.headers || {});
  if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken);
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      const body = await response.text();
      if (body) message = body;
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState([]);
  const [activeView, setActiveView] = useState(() => new URLSearchParams(window.location.search).get('section') === 'resume' ? 'resume' : 'journal');
  const [resumeForm, setResumeForm] = useState(emptyResumeForm());
  const [newPhoto, setNewPhoto] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [newFiles, setNewFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getCsrfToken();
        const session = await requestJson('/api/auth/me');
        if (!active) return;
        setCsrfToken(token);
        setAuthenticated(session.authenticated);
        if (session.authenticated) await loadAdminData();
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function loadPosts() {
    const savedPosts = await requestJson('/api/posts?sort=newest');
    setPosts(savedPosts);
  }

  async function loadResume() {
    const savedResume = await requestJson('/api/resume');
    setResumeForm(toResumeForm(savedResume));
    setNewPhoto(null);
  }

  async function loadAdminData() {
    await Promise.all([loadPosts(), loadResume()]);
  }

  function startNewPost() {
    setEditingPost(null);
    setForm(emptyForm());
    setNewFiles([]);
    setError('');
    setNotice('');
  }

  function startEditing(post) {
    setEditingPost(post);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      attachments: [...(post.attachments || [])],
    });
    setNewFiles([]);
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const token = csrfToken || await getCsrfToken();
      await requestJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }, token);
      setCsrfToken(token);
      setAuthenticated(true);
      setPassword('');
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError('');
    try {
      await requestJson('/api/auth/logout', { method: 'POST' }, csrfToken);
      setAuthenticated(false);
      setPosts([]);
      startNewPost();
      setCsrfToken('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const attachments = [...form.attachments];
      for (const file of newFiles) {
        const data = new FormData();
        data.append('file', file);
        attachments.push(await requestJson('/api/uploads', { method: 'POST', body: data }, csrfToken));
      }
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        attachments,
      };
      const saved = await requestJson(
        editingPost ? `/api/posts/${editingPost.id}` : '/api/posts',
        {
          method: editingPost ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        csrfToken,
      );
      setPosts((current) => [saved, ...current.filter((post) => post.id !== saved.id)]
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)));
      startNewPost();
      setNotice(editingPost ? 'Your post has been updated.' : 'Your post is now published.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      await requestJson(`/api/posts/${post.id}`, { method: 'DELETE' }, csrfToken);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (editingPost?.id === post.id) startNewPost();
      setNotice('The post has been deleted.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveResume(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      let photoUrl = resumeForm.photoUrl;
      if (newPhoto) {
        const data = new FormData();
        data.append('file', newPhoto);
        const uploaded = await requestJson('/api/uploads', { method: 'POST', body: data }, csrfToken);
        photoUrl = uploaded.url;
      }

      const payload = {
        ...resumeForm,
        photoUrl,
        skills: resumeForm.skillsText.split(/\r?\n/).map((skill) => skill.trim()).filter(Boolean),
        experience: populatedRows(resumeForm.experience),
        education: populatedRows(resumeForm.education),
        projects: populatedRows(resumeForm.projects),
        certifications: populatedRows(resumeForm.certifications),
        languages: populatedRows(resumeForm.languages),
      };
      delete payload.skillsText;
      const savedResume = await requestJson('/api/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, csrfToken);
      setResumeForm(toResumeForm(savedResume));
      setNewPhoto(null);
      setNotice('Your resume has been saved and published.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function chooseView(view) {
    setActiveView(view);
    window.history.replaceState(null, '', view === 'resume' ? '/admin?section=resume' : '/admin');
    setError('');
    setNotice('');
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="brand" href="/"><span className="brand-mark">s.</span><span>{profile.name}<span className="brand-dot">.</span></span></a>
        <a className="admin-public-link" href="/"><ArrowLeft size={15} /> View public website</a>
      </header>

      {initializing ? (
        <main className="admin-loading">Loading your secure admin area…</main>
      ) : !authenticated ? (
        <main className="admin-login">
          <span className="section-kicker">PRIVATE AREA</span>
          <h1>Welcome back<span className="heading-period">.</span></h1>
          <p>Sign in to manage your journal. This area is only for the site owner.</p>
          <form onSubmit={handleLogin}>
            <label className="form-label-custom">Username
              <input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label className="form-label-custom">Password
              <input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="primary-button admin-submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} <ArrowUp size={15} />
            </button>
          </form>
        </main>
      ) : (
        <main className="admin-main">
          <div className="admin-title-row">
            <div><span className="section-kicker">YOUR PRIVATE WORKSPACE</span><h1>{activeView === 'resume' ? 'Resume editor' : 'Journal admin'}<span className="heading-period">.</span></h1></div>
            <div className="admin-header-actions">
              <div className="admin-view-tabs" role="group" aria-label="Admin section">
                <button type="button" aria-pressed={activeView === 'journal'} className={activeView === 'journal' ? 'active' : ''} onClick={() => chooseView('journal')}>Journal</button>
                <button type="button" aria-pressed={activeView === 'resume'} className={activeView === 'resume' ? 'active' : ''} onClick={() => chooseView('resume')}>Resume</button>
              </div>
              <button className="write-button" onClick={handleLogout} disabled={busy}><LogOut size={15} /> Sign out</button>
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
          {activeView === 'resume' ? (
            <ResumeEditor
              resumeForm={resumeForm}
              setResumeForm={setResumeForm}
              newPhoto={newPhoto}
              setNewPhoto={setNewPhoto}
              busy={busy}
              onSave={handleSaveResume}
            />
          ) : (
            <>
          <section className="admin-editor">
            <div className="admin-editor-heading">
              <div><span className="section-kicker">{editingPost ? 'MAKE A CHANGE' : 'SHARE SOMETHING NEW'}</span><h2>{editingPost ? 'Edit post' : 'New post'}<span className="heading-period">.</span></h2></div>
              {editingPost && <button className="write-button" type="button" onClick={startNewPost}><X size={15} /> Cancel edit</button>}
            </div>
            <form onSubmit={handleSave}>
              <label className="form-label-custom">Title
                <input required maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Give your post a title" />
              </label>
              <label className="form-label-custom">Short description
                <textarea required maxLength={320} rows="2" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="A sentence or two to draw people in" />
              </label>
              <label className="form-label-custom">Your post
                <textarea required maxLength={10000} rows="6" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Write something worth sharing..." />
              </label>
              <div className="admin-form-row">
                <label className="form-label-custom">Category
                  <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    <option>Notes</option><option>Builds</option><option>Life</option><option>Links</option>
                  </select>
                </label>
                <label className="form-label-custom">Add documents or images <span className="optional-label">optional · max 10 MB per file</span>
                  <span className="upload-field"><Upload size={15} /><span>{newFiles.length ? `${newFiles.length} file(s) selected` : 'Choose files'}</span>
                    <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp" onChange={(event) => setNewFiles(Array.from(event.target.files || []))} />
                  </span>
                </label>
              </div>
              {newFiles.length > 0 && <div className="selected-files">{newFiles.map((file) => <span key={`${file.name}-${file.size}`}><FileText size={13} />{file.name}</span>)}</div>}
              {form.attachments.length > 0 && (
                <div className="admin-attachments">
                  <span className="section-kicker">ATTACHED FILES</span>
                  {form.attachments.map((file) => (
                    <span className="admin-attachment" key={file.url}>
                      {file.contentType?.startsWith('image/') ? <Image size={14} /> : <FileText size={14} />}
                      {file.filename}
                      <button type="button" onClick={() => setForm({ ...form, attachments: form.attachments.filter((item) => item.url !== file.url) })} aria-label={`Remove ${file.filename}`}><X size={14} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="admin-save-row"><span>Posts appear on your public journal when published.</span><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving…' : editingPost ? 'Save changes' : 'Publish post'}<ArrowUp size={15} /></button></div>
            </form>
          </section>

          <section className="admin-posts">
            <div className="admin-editor-heading"><div><span className="section-kicker">PUBLISHED TO YOUR WEBSITE</span><h2>Your posts<span className="heading-period">.</span></h2></div><span className="admin-post-count">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span></div>
            {posts.length === 0 ? <p className="admin-empty">No posts yet. Start with a note you would like to share.</p> : (
              <div className="admin-post-list">
                {posts.map((post) => (
                  <article className="admin-post-row" key={post.id}>
                    <div className="admin-post-info"><span className="post-category">{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p></div>
                    <div className="admin-post-actions">
                      <button type="button" className="write-button" onClick={() => startEditing(post)} disabled={busy}><Pencil size={14} /> Edit</button>
                      <button type="button" className="delete-button" onClick={() => handleDelete(post)} disabled={busy} aria-label={`Delete ${post.title}`}><Trash2 size={16} /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
            </>
          )}
        </main>
      )}
      <footer className="admin-footer"><span>Private admin · Changes publish to your public website</span><a href="/">Go to public site</a></footer>
    </div>
  );
}

function ResumeEditor({ resumeForm, setResumeForm, newPhoto, setNewPhoto, busy, onSave }) {
  function updateField(event) {
    setResumeForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateRow(section, index, field, value) {
    setResumeForm((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  function addRow(section, emptyItem) {
    setResumeForm((current) => ({ ...current, [section]: [...current[section], emptyItem()] }));
  }

  function removeRow(section, index) {
    setResumeForm((current) => ({ ...current, [section]: current[section].filter((_, itemIndex) => itemIndex !== index) }));
  }

  return (
    <section className="admin-editor resume-admin-editor">
      <div className="admin-editor-heading">
        <div><span className="section-kicker">PUBLIC RESUME</span><h2>Personal details &amp; experience<span className="heading-period">.</span></h2></div>
        <a className="write-button" href="/resume.html" target="_blank" rel="noreferrer">Preview resume <ArrowUp size={14} /></a>
      </div>
      <p className="resume-editor-help">Complete only the sections you want to show. Use one achievement per line in each description; the public resume has both photo and no-photo print layouts.</p>
      <form onSubmit={onSave}>
        <div className="resume-admin-grid">
          <label className="form-label-custom">Full name
            <input name="name" required maxLength={120} value={resumeForm.name} onChange={updateField} />
          </label>
          <label className="form-label-custom">Professional title
            <input name="headline" required maxLength={160} value={resumeForm.headline} onChange={updateField} placeholder="e.g. Software Engineer" />
          </label>
        </div>
        <div className="resume-admin-grid resume-admin-grid-three">
          <label className="form-label-custom">Email
            <input name="email" type="email" maxLength={254} value={resumeForm.email} onChange={updateField} />
          </label>
          <label className="form-label-custom">Phone
            <input name="phone" type="tel" maxLength={60} value={resumeForm.phone} onChange={updateField} />
          </label>
          <label className="form-label-custom">Address
            <input name="address" maxLength={200} value={resumeForm.address} onChange={updateField} />
          </label>
          <label className="form-label-custom">Location
            <input name="location" maxLength={120} value={resumeForm.location} onChange={updateField} />
          </label>
        </div>
        <div className="resume-admin-grid">
          <label className="form-label-custom">Website
            <input name="website" type="url" maxLength={2000} value={resumeForm.website} onChange={updateField} placeholder="https://" />
          </label>
          <label className="form-label-custom">LinkedIn URL
            <input name="linkedin" type="url" maxLength={2000} value={resumeForm.linkedin} onChange={updateField} placeholder="https://" />
          </label>
          <label className="form-label-custom">GitHub URL
            <input name="github" type="url" maxLength={2000} value={resumeForm.github} onChange={updateField} placeholder="https://" />
          </label>
        </div>
        <label className="form-label-custom">Professional summary
          <textarea name="summary" rows="4" maxLength={3000} value={resumeForm.summary} onChange={updateField} placeholder="Briefly summarize your experience, strengths, and the work you are looking for." />
        </label>

        <div className="resume-photo-editor">
          <div>
            <span className="section-kicker">OPTIONAL PORTRAIT</span>
            <p>Used only by the “With photo” template. JPG, PNG, or WEBP; maximum 10 MB. Uploaded photos are public.</p>
          </div>
          <div className="resume-photo-controls">
            {resumeForm.photoUrl && <img src={resumeForm.photoUrl} alt="Current resume portrait" />}
            <label className="upload-field"><Upload size={15} /><span>{newPhoto?.name || 'Choose a photo'}</span>
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setNewPhoto(event.target.files?.[0] || null)} />
            </label>
            {resumeForm.photoUrl && <button className="write-button" type="button" onClick={() => { setResumeForm((current) => ({ ...current, photoUrl: '' })); setNewPhoto(null); }}>Remove photo</button>}
          </div>
        </div>

        <label className="form-label-custom">Skills <span className="optional-label">one skill per line</span>
          <textarea name="skillsText" rows="3" maxLength={5000} value={resumeForm.skillsText} onChange={updateField} placeholder={'JavaScript\nReact\nSpring Boot'} />
        </label>

        <ResumeListEditor title="Experience" items={resumeForm.experience} fields={[
          { key: 'role', label: 'Job title', required: true },
          { key: 'company', label: 'Company' },
          { key: 'location', label: 'Location' },
          { key: 'startDate', label: 'Start date' },
          { key: 'endDate', label: 'End date' },
          { key: 'description', label: 'Achievements (one per line)', multiline: true },
        ]} onAdd={() => addRow('experience', emptyExperience)} onRemove={(index) => removeRow('experience', index)} onChange={(index, field, value) => updateRow('experience', index, field, value)} />
        <ResumeListEditor title="Education" items={resumeForm.education} fields={[
          { key: 'degree', label: 'Degree or qualification', required: true },
          { key: 'institution', label: 'Institution' },
          { key: 'location', label: 'Location' },
          { key: 'startDate', label: 'Start date' },
          { key: 'endDate', label: 'End date' },
          { key: 'details', label: 'Additional details', multiline: true },
        ]} onAdd={() => addRow('education', emptyEducation)} onRemove={(index) => removeRow('education', index)} onChange={(index, field, value) => updateRow('education', index, field, value)} />
        <ResumeListEditor title="Projects" items={resumeForm.projects} fields={[
          { key: 'name', label: 'Project name', required: true },
          { key: 'technologies', label: 'Technologies' },
          { key: 'url', label: 'Project URL', type: 'url' },
          { key: 'description', label: 'Description', multiline: true },
        ]} onAdd={() => addRow('projects', emptyProject)} onRemove={(index) => removeRow('projects', index)} onChange={(index, field, value) => updateRow('projects', index, field, value)} />
        <ResumeListEditor title="Certifications" items={resumeForm.certifications} fields={[
          { key: 'name', label: 'Certification', required: true },
          { key: 'issuer', label: 'Issuing organization' },
          { key: 'date', label: 'Date' },
        ]} onAdd={() => addRow('certifications', emptyCertification)} onRemove={(index) => removeRow('certifications', index)} onChange={(index, field, value) => updateRow('certifications', index, field, value)} />
        <ResumeListEditor title="Languages" items={resumeForm.languages} fields={[
          { key: 'name', label: 'Language', required: true },
          { key: 'proficiency', label: 'Proficiency' },
        ]} onAdd={() => addRow('languages', emptyLanguage)} onRemove={(index) => removeRow('languages', index)} onChange={(index, field, value) => updateRow('languages', index, field, value)} />

        <div className="admin-save-row"><span>Changes are saved to the server and appear on the public resume page.</span><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save resume'}<ArrowUp size={15} /></button></div>
      </form>
    </section>
  );
}

function ResumeListEditor({ title, items, fields, onAdd, onRemove, onChange }) {
  return (
    <section className="resume-list-editor">
      <div className="resume-list-heading"><h3>{title}</h3><button type="button" className="write-button" onClick={onAdd}><Plus size={14} /> Add {title.replace(/s$/, '').toLowerCase()}</button></div>
      {items.map((item, index) => (
        <div className="resume-list-item" key={`${title}-${index}`}>
          <div className="resume-list-item-heading"><span>{title} {index + 1}</span><button type="button" className="delete-button" onClick={() => onRemove(index)} aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}><Trash2 size={15} /></button></div>
          <div className="resume-admin-grid">
            {fields.map((field) => {
              const Input = field.multiline ? 'textarea' : 'input';
              return (
                <label className="form-label-custom" key={field.key}>{field.label}
                  <Input
                    type={field.multiline ? undefined : field.type || 'text'}
                    required={field.required}
                    maxLength={field.key === 'description' ? 3000 : 2000}
                    rows={field.multiline ? 3 : undefined}
                    value={item[field.key]}
                    onChange={(event) => onChange(index, field.key, event.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function emptyResumeForm() {
  return toResumeForm({
    name: profile.name,
    headline: profile.role,
    email: '',
    phone: '',
    address: '',
    location: profile.location,
    website: '',
    linkedin: '',
    github: '',
    summary: '',
    photoUrl: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  });
}

function toResumeForm(resume) {
  return {
    ...resume,
    skillsText: (resume.skills || []).join('\n'),
    experience: resume.experience || [],
    education: resume.education || [],
    projects: resume.projects || [],
    certifications: resume.certifications || [],
    languages: resume.languages || [],
  };
}

function populatedRows(rows) {
  return rows.filter((row) => Object.values(row).some((value) => value?.trim()));
}

function emptyExperience() {
  return { role: '', company: '', location: '', startDate: '', endDate: '', description: '' };
}

function emptyEducation() {
  return { degree: '', institution: '', location: '', startDate: '', endDate: '', details: '' };
}

function emptyProject() {
  return { name: '', description: '', technologies: '', url: '' };
}

function emptyCertification() {
  return { name: '', issuer: '', date: '' };
}

function emptyLanguage() {
  return { name: '', proficiency: '' };
}

function emptyForm() {
  return { title: '', excerpt: '', content: '', category: 'Notes', attachments: [] };
}

export default AdminPage;
