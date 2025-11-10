import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Removed old logo/text artefact from top left */}
      <div className={styles.description}>
        <p>
          Pages:&nbsp;
          <a href="/about">About</a> &middot; <a href="/upload">Upload</a> &middot; <a href="/rig-builder">Rig Builder</a>
        </p>
        <div style={{ marginTop: 24 }}>
          <Link
            href="/rigistry/carnet"
            style={{
              padding: '12px 24px',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              display: 'inline-block'
            }}
          >Create a Carnet →</Link>
        </div>
      </div>
    </main>
  );
}
