export const dynamic = 'force-static';

const uspBullets = [
  'Catalogue instruments with serials & photos (insurance + carnet ready)',
  'Showcase complete rigs visually and narratively',
  'Deep dive: exact gear settings, strings, pickups, tunings, maintenance dates',
  'Connect owners of similar or rare instruments; ask, trade, collaborate',
  'Search a normalized gear + user preset knowledge base',
  'Attach digital model preset files via external storage links',
];

const mvpPhase = [
  'Gear catalogue (images + metadata)',
  'User profiles & authentication',
  'Rig builder (static drag & drop)',
  'Simple preset / link attachments',
];
const growthPhase = [
  'Realtime chat & comments',
  'Advanced signal-chain editor (connections/edges)',
  'Preset parsing & structured tone objects',
  'Search across gear + settings + presets',
];
const scalePhase = [
  'Subscriptions & affiliate integration',
  '3D / AR try-on & virtual rigs',
  'Performance & storage optimizations (S3/CDN)',
  'Licensing + attribution automation',
];

import rigistryStyles from '../rigistry/Rigistry.module.css';

export default function AboutPage() {
  return (
    <main className={rigistryStyles.rigistryMain} style={{ padding: '0 0 64px', color: '#fff' }}>
      {/* Hero section */}
      <section
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 28,
          padding: '90px 32px 110px'
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-fibre, Fibre Vintage, serif)', fontSize: 'clamp(3rem,8vw,5rem)', margin: 0, lineHeight: 1 }}>
          Rigistry
        </h1>
        <h2
          style={{
            fontFamily: 'var(--font-tungstern, Tungstern Semibold, sans-serif)',
            fontSize: 'clamp(1.2rem,2.8vw,1.9rem)',
            fontWeight: 600,
            letterSpacing: '0.14em',
            margin: 0,
            textTransform: 'uppercase'
          }}
        >
          Your Gear · Your Story · Your Signal Chain
        </h2>
        <p style={{ maxWidth: 920, margin: '4px auto 0', fontSize: '1.1rem', lineHeight: 1.55, fontWeight: 500 }}>
          Catalogue instruments & accessories, capture exact settings, build visual rigs, and discover players who share your sonic DNA.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
          <a
            href="/rigistry"
            style={{
              padding: '14px 28px',
              background: '#22c55e',
              color: '#041105',
              borderRadius: 32,
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(0,255,140,0.25)',
              letterSpacing: '0.05em'
            }}
          >
            Explore Rigistry →
          </a>
          <a
            href="/rigistry/add"
            style={{
              padding: '14px 28px',
              background: '#ffffff',
              color: '#111',
              borderRadius: 32,
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(255,255,255,0.18)',
              letterSpacing: '0.05em'
            }}
          >
            Add Your First Gear +
          </a>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 36, marginTop: 64 }}>
          {uspBullets.map((b) => (
            <div
              key={b}
              style={{
                minWidth: 220,
                maxWidth: 300,
                background: 'rgba(255,255,255,0.05)',
                padding: '14px 16px 18px',
                borderRadius: 18,
                backdropFilter: 'blur(3px)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.85rem',
                lineHeight: 1.4
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </section>
      {/* Roadmap & narrative */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '56px 32px 0' }}>
        <div style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 32 }}>
          <div>
            <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>USP</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uspBullets.map((b) => (
                <li key={b} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#888' }}>•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>MVP Phase</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mvpPhase.map((b) => (
                <li key={b}><span>{b}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>Growth Phase</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {growthPhase.map((b) => (
                <li key={b}><span>{b}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>Scale Phase</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scalePhase.map((b) => (
                <li key={b}><span>{b}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 16, padding: '0 32px' }}>
        <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>Why Visual Rigs?</h3>
        <p style={{ maxWidth: 900, lineHeight: 1.55 }}>
          A rig is a narrative: guitar → pedals → amps → speakers → modeling systems → presets. Existing platforms show pieces in isolation. Rigistry lets you drag, connect, annotate, and share the whole signal chain. For digital devices you can link original preset files instead of re-entering parameters manually.
        </p>
        <p style={{ maxWidth: 900, lineHeight: 1.55 }}>
          Future enhancements will introduce chain graphs, preset parsing, and even augmented reality try-on experiences so you can see yourself with prospective instruments before buying.
        </p>
      </section>
      <section style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 16, padding: '0 32px' }}>
        <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>Data & Licensing</h3>
        <p style={{ maxWidth: 900, lineHeight: 1.55 }}>
          Catalog entries will blend user-created gear with curated sources (Equipboard, Reverb, Effects databases). All third-party imagery and specifications will respect licensing and attribution terms. Users retain control over their uploaded photos and can opt-in to share preset links.
        </p>
      </section>
    </main>
  );
}
