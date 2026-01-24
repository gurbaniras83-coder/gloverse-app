export default function NotFound() {
  return (
    <div style={{
      background: '#0f0f0f',
      color: 'white',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '1rem'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 - Page Not Found</h1>
      <p style={{ marginTop: '1rem', color: '#a0a0a0' }}>Sorry, the page you are looking for does not exist.</p>
    </div>
  );
}
