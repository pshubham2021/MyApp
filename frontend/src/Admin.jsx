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
        if (session.authenticated) await loadPosts();
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
      await loadPosts();
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
            <div><span className="section-kicker">YOUR PRIVATE WORKSPACE</span><h1>Journal admin<span className="heading-period">.</span></h1></div>
            <button className="write-button" onClick={handleLogout} disabled={busy}><LogOut size={15} /> Sign out</button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
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
        </main>
      )}
      <footer className="admin-footer"><span>Private admin · Changes publish to your public website</span><a href="/">Go to public site</a></footer>
    </div>
  );
}

function emptyForm() {
  return { title: '', excerpt: '', content: '', category: 'Notes', attachments: [] };
}

export default AdminPage;
