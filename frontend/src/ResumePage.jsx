import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, FileText, Moon, Printer, Sun } from 'lucide-react';
import packageInfo from '../package.json';
import { useTheme } from './useTheme.js';
import './resume.css';

const emptyResume = {
  name: '',
  headline: '',
  email: '',
  phone: '',
  address: '',
  location: '',
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
};

function contactLink(value, prefix) {
  return value ? `${prefix}${value}` : undefined;
}

function dateRange(start, end) {
  return [start, end].filter(Boolean).join(' — ');
}

function lineItems(text) {
  return (text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function ResumePage() {
  const { darkMode, toggleTheme } = useTheme();
  const [resume, setResume] = useState(emptyResume);
  const [template, setTemplate] = useState('without-photo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/resume')
      .then((response) => {
        if (!response.ok) throw new Error(`Resume could not be loaded (${response.status}).`);
        return response.json();
      })
      .then((data) => {
        if (active) setResume({ ...emptyResume, ...data });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const showPhoto = template === 'with-photo';
  const contactItems = [
    resume.email && { label: resume.email, href: contactLink(resume.email, 'mailto:') },
    resume.phone && { label: resume.phone, href: contactLink(resume.phone.replace(/[^\d+]/g, ''), 'tel:') },
    resume.address && { label: resume.address },
    resume.location && { label: resume.location },
    resume.website && { label: 'Website', href: resume.website },
    resume.linkedin && { label: 'LinkedIn', href: resume.linkedin },
    resume.github && { label: 'GitHub', href: resume.github },
  ].filter(Boolean);

  return (
    <div className="resume-page">
      <nav className="resume-toolbar" aria-label="Resume actions">
        <a className="resume-back" href="/"><ArrowLeft size={16} /> Portfolio</a>
        <div className="resume-toolbar-actions">
          <button type="button" className="resume-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="resume-template-switch" role="group" aria-label="Resume template">
            <button type="button" className={!showPhoto ? 'selected' : ''} onClick={() => setTemplate('without-photo')}>Without photo</button>
            <button type="button" className={showPhoto ? 'selected' : ''} onClick={() => setTemplate('with-photo')}>With photo</button>
          </div>
          <a className="resume-edit" href="/admin?section=resume">Edit resume</a>
          <button type="button" className="resume-print" onClick={() => window.print()}><Printer size={15} /> Print / save PDF</button>
        </div>
      </nav>

      {loading ? <p className="resume-state">Loading resume…</p> : error ? (
        <p className="resume-state resume-state-error" role="alert">{error}</p>
      ) : (
        <main className={`resume-paper ${showPhoto ? 'resume-with-photo' : 'resume-without-photo'}`}>
          <header className="resume-heading">
            {showPhoto && (
              resume.photoUrl
                ? <img className="resume-photo" src={resume.photoUrl} alt={`${resume.name} portrait`} />
                : <div className="resume-photo resume-photo-placeholder" aria-label="No photo uploaded">{resume.name?.charAt(0) || '?'}</div>
            )}
            <div className="resume-identity">
              <h1>{resume.name}</h1>
              <p className="resume-headline">{resume.headline}</p>
            </div>
            <address className="resume-contact">
              {contactItems.map((item) => item.href
                ? <a href={item.href} key={item.label}>{item.label}</a>
                : <span key={item.label}>{item.label}</span>)}
            </address>
          </header>

          {resume.summary && <ResumeSection title="Professional Summary"><p>{resume.summary}</p></ResumeSection>}

          {resume.experience?.length > 0 && (
            <ResumeSection title="Experience">
              {resume.experience.map((item, index) => (
                <article className="resume-entry" key={`${item.role}-${index}`}>
                  <div className="resume-entry-heading">
                    <div><h3>{item.role}</h3><p className="resume-entry-subtitle">{[item.company, item.location].filter(Boolean).join(' · ')}</p></div>
                    <time>{dateRange(item.startDate, item.endDate)}</time>
                  </div>
                  {lineItems(item.description).length > 0 && <ul>{lineItems(item.description).map((line, lineIndex) => <li key={lineIndex}>{line}</li>)}</ul>}
                </article>
              ))}
            </ResumeSection>
          )}

          {resume.education?.length > 0 && (
            <ResumeSection title="Education">
              {resume.education.map((item, index) => (
                <article className="resume-entry" key={`${item.degree}-${index}`}>
                  <div className="resume-entry-heading">
                    <div><h3>{item.degree}</h3><p className="resume-entry-subtitle">{[item.institution, item.location].filter(Boolean).join(' · ')}</p></div>
                    <time>{dateRange(item.startDate, item.endDate)}</time>
                  </div>
                  {item.details && <p>{item.details}</p>}
                </article>
              ))}
            </ResumeSection>
          )}

          {resume.projects?.length > 0 && (
            <ResumeSection title="Projects">
              {resume.projects.map((item, index) => (
                <article className="resume-entry" key={`${item.name}-${index}`}>
                  <div className="resume-entry-heading">
                    <h3>{item.url ? <a href={item.url}>{item.name} <ExternalLink size={12} /></a> : item.name}</h3>
                    {item.technologies && <span className="resume-entry-subtitle">{item.technologies}</span>}
                  </div>
                  {item.description && <p>{item.description}</p>}
                </article>
              ))}
            </ResumeSection>
          )}

          {resume.skills?.length > 0 && <ResumeSection title="Skills"><ul className="resume-skill-list">{resume.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></ResumeSection>}

          {resume.certifications?.length > 0 && (
            <ResumeSection title="Certifications">
              {resume.certifications.map((item, index) => (
                <article className="resume-entry resume-compact-entry" key={`${item.name}-${index}`}>
                  <h3>{item.name}</h3><p>{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>
                </article>
              ))}
            </ResumeSection>
          )}

          {resume.languages?.length > 0 && (
            <ResumeSection title="Languages">
              <ul className="resume-inline-list">{resume.languages.map((item, index) => <li key={`${item.name}-${index}`}>{item.name}{item.proficiency && <span> — {item.proficiency}</span>}</li>)}</ul>
            </ResumeSection>
          )}

          {contactItems.length === 0 && !resume.summary && resume.experience?.length === 0 && resume.education?.length === 0
            && resume.projects?.length === 0 && resume.skills?.length === 0 && resume.certifications?.length === 0
            && resume.languages?.length === 0 && (
              <div className="resume-empty"><FileText size={20} /><p>Add your resume details in the admin area to complete this page.</p></div>
            )}
          <footer className="resume-version">Application v{packageInfo.version}</footer>
        </main>
      )}
    </div>
  );
}

function ResumeSection({ title, children }) {
  return <section className="resume-section"><h2>{title}</h2>{children}</section>;
}

export default ResumePage;
