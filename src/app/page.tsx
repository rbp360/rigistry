import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Image src="/branding/logo1.png" alt="Rigistry logo" width={160} height={160} />
          <h1>Rigistry</h1>
          <p>Catalog your rigs. Showcase. Connect.</p>
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
