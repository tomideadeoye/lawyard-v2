'use client';

import { useRef, useState } from 'react';
import { createArticle, createPodcast } from '../../actions';

export function CreateContentDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<'article' | 'podcast'>('article');

  return (
    <>
      <button type="button" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}
        onClick={() => dialogRef.current?.showModal()}
      >
        + Create New
      </button>

      <dialog
        ref={dialogRef}
        style={{
          background: 'var(--card)', color: 'var(--foreground)',
          border: '1px solid var(--card-border)', borderRadius: '16px',
          padding: '32px', maxWidth: '520px', width: '90%',
          fontFamily: 'var(--font-sans)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Create New Content</h3>
          <button type="button" onClick={() => dialogRef.current?.close()}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
          >✕</button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
          <button type="button" onClick={() => setType('article')}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
              border: type === 'article' ? '1px solid var(--card-border)' : '1px solid transparent',
              background: type === 'article' ? 'var(--card)' : 'transparent',
              color: type === 'article' ? 'var(--foreground)' : '#94A3B8',
            }}
          >
            📄 Article
          </button>
          <button type="button" onClick={() => setType('podcast')}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
              border: type === 'podcast' ? '1px solid var(--card-border)' : '1px solid transparent',
              background: type === 'podcast' ? 'var(--card)' : 'transparent',
              color: type === 'podcast' ? 'var(--foreground)' : '#94A3B8',
            }}
          >
            🎙️ Podcast
          </button>
        </div>

        {type === 'article' ? (
          <form action={createArticle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            onSubmit={() => setTimeout(() => dialogRef.current?.close(), 100)}>
            <Field label="Title">
              <input name="title" required style={inputStyle} placeholder="Article title..." />
            </Field>
            <Field label="Slug">
              <input name="slug" required style={inputStyle} placeholder="article-title-slug" />
            </Field>
            <Field label="Content (Markdown)">
              <textarea name="content" required rows={6} style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }} />
            </Field>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Article</button>
            </div>
          </form>
        ) : (
          <form action={createPodcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            onSubmit={() => setTimeout(() => dialogRef.current?.close(), 100)}>
            <Field label="Title">
              <input name="title" required style={inputStyle} placeholder="Podcast title..." />
            </Field>
            <Field label="Media URL">
              <input name="media_url" required type="url" style={inputStyle} placeholder="https://..." />
            </Field>
            <Field label="Media Type">
              <select name="media_type" style={inputStyle}>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Podcast</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0',
  color: '#0F172A', padding: '10px 14px', borderRadius: '8px',
  fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
};
