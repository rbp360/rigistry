import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Removed old logo/text artefact from top left */}
      <div className={styles.description}>
        <p>
          Pages:&nbsp;
          <a href="/about">About</a> &middot; <a href="/upload">Upload</a> &middot; <a href="/rig-builder">Rig Builder</a>
        </p>
      </div>
    </main>
  );
}
