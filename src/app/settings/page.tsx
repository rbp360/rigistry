import DeletedItemsManager from './DeletedItemsManager';
import rigistryStyles from '../rigistry/Rigistry.module.css';

export default function SettingsPage() {
  return (
    <main className={rigistryStyles.rigistryMain} style={{ padding: 24, color: '#fff' }}>
      <h1>Settings</h1>
      <p>Manage your account preferences and data below.</p>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 8 }}>Permanently Delete</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>Items deleted from rooms appear here. You can restore them or permanently delete them.</p>
        <div style={{ marginTop: 16 }}>
          <DeletedItemsManager />
        </div>
      </section>
    </main>
  );
}
