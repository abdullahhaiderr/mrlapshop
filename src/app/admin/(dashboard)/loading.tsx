export default function AdminLoading() {
  return (
    <section className="admin-content admin-loading" aria-live="polite" aria-busy="true">
      <div className="admin-loading-heading">
        <span className="admin-loading-spinner" aria-hidden="true" />
        <div><strong>Loading your workspace</strong><span>Preparing store information…</span></div>
      </div>
      <div className="admin-loading-stats">
        {Array.from({ length: 4 }, (_, index) => <div key={index} />)}
      </div>
      <div className="admin-loading-panel"><div /><div /><div /><div /></div>
    </section>
  );
}
