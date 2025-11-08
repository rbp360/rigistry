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

export default function AboutPage() {
  return (
    <main style={{ padding: '64px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 style={{ fontFamily: 'Fibre Vintage, serif', fontSize: '4rem', margin: 0 }}>Rigistry</h1>
          <h2 style={{ fontFamily: 'Tungstern Semibold, sans-serif', fontSize: '1.6rem', fontWeight: 600, letterSpacing: '0.12em', margin: 0 }}>Your Gear. Your Story. Your Signal Chain.</h2>
          <p style={{ maxWidth: 800, margin: '12px auto 0', fontSize: '1.05rem', lineHeight: 1.5 }}>
            Rigistry is a creative gear catalogue and social platform for musicians. Log every instrument and accessory, capture exact settings, build visual rigs, and connect with players who share your sonic DNA.
          </p>
        </div>
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
      <section style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>Why Visual Rigs?</h3>
        <p style={{ maxWidth: 900, lineHeight: 1.55 }}>
          A rig is a narrative: guitar → pedals → amps → speakers → modeling systems → presets. Existing platforms show pieces in isolation. Rigistry lets you drag, connect, annotate, and share the whole signal chain. For digital devices you can link original preset files instead of re-entering parameters manually.
        </p>
        <p style={{ maxWidth: 900, lineHeight: 1.55 }}>
          Future enhancements will introduce chain graphs, preset parsing, and even augmented reality try-on experiences so you can see yourself with prospective instruments before buying.
        </p>
      </section>
      <section style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontFamily: 'Tungstern Semibold', letterSpacing: '0.1em', fontSize: '0.95rem', textTransform: 'uppercase' }}>Data & Licensing</h3>
        <p style={{ maxWidth: 900, lineHeight: 1.55 }}>
          Catalog entries will blend user-created gear with curated sources (Equipboard, Reverb, Effects databases). All third-party imagery and specifications will respect licensing and attribution terms. Users retain control over their uploaded photos and can opt-in to share preset links.
        </p>
      </section>
    </main>
  );
}
