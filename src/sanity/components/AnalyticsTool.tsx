export function AnalyticsIcon() {
  return <span style={{ fontSize: '1.1em' }}>📊</span>
}

export function AnalyticsTool() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '16px',
      fontFamily: 'sans-serif',
    }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Analytics</h2>

      <a
        href="https://analytics.google.com/analytics/web/#/a56115010p391057659/reports/intelligenthome"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          background: '#000',
          color: '#fff',
          padding: '12px 32px',
          textDecoration: 'none',
          fontSize: '14px',
          letterSpacing: '0.05em',
          width: '260px',
          textAlign: 'center',
        }}
      >
        Google Analytics →
      </a>

      <p style={{ color: '#888', fontSize: '12px', marginTop: '8px' }}>
        Opens in a new tab.
      </p>
    </div>
  )
}
