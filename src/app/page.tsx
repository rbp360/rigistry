import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontFamily: 'Fibre Vintage, Arial, Helvetica, sans-serif', fontSize: '3rem', fontWeight: 'normal', letterSpacing: '0.05em' }}>Rigistry</h1>
            <p style={{ fontFamily: 'Tungstern Semibold, Arial, Helvetica, sans-serif', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.03em' }}>Catalog your rigs. Showcase. Connect.</p>
        </div>
      </div>
      <div className={styles.description}>
        <p>
          Pages:&nbsp;
          <a href="/about">About</a> &middot; <a href="/upload">Upload</a> &middot; <a href="/rig-builder">Rig Builder</a>
        </p>
      </div>
    </main>
  );
}
