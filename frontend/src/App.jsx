import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Cloud,
  ExternalLink,
  FileText,
  Github,
  Heart,
  Image,
  Instagram,
  Link as LinkIcon,
  MapPin,
  Menu,
  Moon,
  Search,
  Send,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { profile, projects, samplePosts } from './data.js';
import packageInfo from '../package.json';

const iconMap = { sparkles: Sparkles, book: BookOpen, cloud: Cloud };

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [posts, setPosts] = useState(samplePosts);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [apiError, setApiError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search, sort });
        const response = await fetch(`/api/posts?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`The posts service returned ${response.status}.`);
        setPosts(await response.json());
        setApiError('');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setApiError('The posts API is offline. Start the Spring Boot server to publish and load saved posts.');
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, sort]);

  const visiblePosts = useMemo(() => {
    if (!apiError) return posts;
    const term = search.trim().toLowerCase();
    return samplePosts
      .filter((post) =>
        [post.title, post.excerpt, post.content, post.category].some((value) =>
          value.toLowerCase().includes(term),
        ),
      )
      .sort((a, b) => {
        if (sort === 'oldest') return new Date(a.publishedAt) - new Date(b.publishedAt);
        if (sort === 'title') return a.title.localeCompare(b.title);
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });
  }, [apiError, posts, search, sort]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label={`${profile.name} home`}>
          <span className="brand-mark">s.</span>
          <span>{profile.name}<span className="brand-dot">.</span></span>
        </a>
        <button
          className="mobile-menu-button icon-button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav className={`main-nav ${mobileMenuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          <a href="#projects" onClick={() => setMobileMenuOpen(false)}>Projects</a>
          <a href="#journal" onClick={() => setMobileMenuOpen(false)}>Journal</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
          <button className="theme-toggle" onClick={() => setDarkMode((mode) => !mode)}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <a className="contact-link" href={`mailto:${profile.email}`}>
            Say hello <ArrowUp size={14} className="contact-arrow" />
          </a>
        </nav>
      </header>

      <main id="home">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> OPEN TO WHAT&apos;S NEXT</div>
            <h1>Making the internet<br />a little more <em>human.</em></h1>
            <p className="hero-description">
              Hey, I&apos;m {profile.name} — a developer, maker, and collector of small ideas.
              This is my corner of the internet.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#projects">
                Explore my work <ArrowDown size={16} />
              </a>
              <a className="text-button" href={profile.resumeUrl}>
                <FileText size={16} /> Click to see my resume
              </a>
            </div>
            <div className="hero-meta">
              <span><MapPin size={14} /> {profile.location}</span>
              <span className="meta-divider" />
              <span><Heart size={14} /> Building things that matter</span>
            </div>
          </div>
          <div className="hero-art" aria-label={`Illustration representing ${profile.name}`}>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <div className="art-card art-card-back"><span>MAKE</span><span>GOOD</span><span>THINGS</span></div>
            <div className="art-card art-card-front">
              <span className="art-kicker">A NOTE TO SELF</span>
              <span className="art-title">Stay curious.<br />Keep making.</span>
              <span className="art-scribble">✳</span>
            </div>
            <span className="art-star star-one">✳</span>
            <span className="art-star star-two">✴</span>
            <span className="art-caption">a work in progress, always</span>
          </div>
        </section>

        <div className="content-layout">
          <div className="main-column">
            <section className="section-block" id="projects">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">A FEW THINGS I&apos;VE MADE</span>
                  <h2>Selected projects<span className="heading-period">.</span></h2>
                </div>
                <a className="section-link" href="https://github.com/your-username" target="_blank" rel="noreferrer">
                  More on GitHub <ExternalLink size={14} />
                </a>
              </div>
              <div className="project-grid">
                {projects.map((project) => {
                  const ProjectIcon = iconMap[project.icon];
                  return (
                    <a className="project-card" href={project.url} key={project.name} target="_blank" rel="noreferrer">
                      <div className={`project-art ${project.className}`}>
                        <span className="project-art-icon"><ProjectIcon size={28} strokeWidth={1.5} /></span>
                        <span className="project-art-name">{project.name}</span>
                        <span className="project-art-corner"><ExternalLink size={14} /></span>
                      </div>
                      <div className="project-details">
                        <div className="project-title-line"><h3>{project.name}</h3><span>{project.language}</span></div>
                        <p>{project.description}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>

            <section className="section-block journal-section" id="journal">
              <div className="section-heading journal-heading">
                <div>
                  <span className="section-kicker">THOUGHTS, LINKS & LITTLE MOMENTS</span>
                  <h2>The journal<span className="heading-period">.</span></h2>
                </div>
                <a className="section-link" href="/admin">Admin sign in <ArrowUp size={13} className="contact-arrow" /></a>
              </div>
              <div className="journal-toolbar">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search posts, notes, links..."
                    aria-label="Search posts"
                  />
                  {search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}
                </label>
                <label className="sort-field">
                  <span>Sort by</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort posts">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title A–Z</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
              {apiError && <p className="api-notice" role="status">{apiError}</p>}
              <div className="post-list">
                {visiblePosts.map((post) => <PostCard post={post} key={post.id} />)}
                {visiblePosts.length === 0 && (
                  <div className="empty-state"><Search size={20} /><p>No posts found. Try a different search.</p></div>
                )}
              </div>
            </section>
          </div>

          <aside className="sidebar">
            <section className="profile-card" id="about">
              <div className="profile-topline"><span>THE PERSON BEHIND THE PIXELS</span><span className="profile-spark">✳</span></div>
              <div className="avatar-wrap"><div className="avatar">S<span>✳</span></div></div>
              <h2>{profile.name}<span className="heading-period">.</span></h2>
              <p className="profile-role">{profile.role}</p>
              <p className="profile-bio">{profile.bio}</p>
              <a className="resume-card" id="resume" href={profile.resumeUrl}>
                <span className="resume-icon"><BriefcaseBusiness size={17} /></span>
                <span><strong>My resume</strong><small>Experience &amp; background</small></span>
                <ArrowUp size={15} className="resume-arrow" />
              </a>
              <div className="social-block" id="socials">
                <span className="section-kicker">FIND ME ELSEWHERE</span>
                <div className="social-list">
                  {profile.socials.map((social) => {
                    const SocialIcon = social.name === 'GitHub' ? Github : social.name === 'Instagram' ? Instagram : social.name === 'Facebook' ? Heart : LinkIcon;
                    return (
                      <a href={social.url} target="_blank" rel="noreferrer" key={social.name}>
                        <span className="social-icon"><SocialIcon size={16} /></span>
                        <span>{social.name}</span>
                        <ExternalLink size={13} className="social-external" />
                      </a>
                    );
                  })}
                </div>
              </div>
              <a className="email-link" href={`mailto:${profile.email}`}>
                <span className="email-icon"><Send size={14} /></span>
                Have a good idea? Say hello <ArrowUp size={13} />
              </a>
            </section>
            <section className="currently-card">
              <div className="currently-icon"><Sparkles size={16} /></div>
              <div><span className="section-kicker">CURRENTLY</span><p>Learning to enjoy the process, not just the launch.</p></div>
            </section>
          </aside>
        </div>

        <footer className="site-footer">
          <a className="brand footer-brand" href="#home"><span className="brand-mark">s.</span><span>{profile.name}<span className="brand-dot">.</span></span></a>
          <span>Made with care, and probably too much coffee.</span>
          <span className="site-version">App v{packageInfo.version}</span>
          <a href="/admin">Admin</a>
        </footer>
      </main>
    </div>
  );
}

function PostCard({ post }) {
  return (
    <article className="post-card">
      <div className="post-date"><CalendarDays size={14} /><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></div>
      <div className="post-content">
        <div className="post-category">{post.category}</div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        {post.content && post.content !== post.excerpt && <details className="post-read-more"><summary>Read the note <ArrowDown size={13} /></summary><p>{post.content}</p></details>}
        {post.attachments?.length > 0 && (
          <div className="attachment-list">
            {post.attachments.map((file, index) => {
              const isImage = file.contentType?.startsWith('image/');
              const AttachmentIcon = isImage ? Image : FileText;
              return (
                <a className="attachment-chip" href={file.url} target="_blank" rel="noreferrer" key={`${file.url}-${index}`}>
                  <AttachmentIcon size={15} />
                  <span>{file.filename}</span>
                  <ExternalLink size={12} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export default App;
