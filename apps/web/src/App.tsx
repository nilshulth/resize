import ImageUpload from './components/ImageUpload'

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f5f5f5'
    }}>
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '40px' 
      }}>
        <h1 style={{ 
          color: '#333',
          fontSize: '2.5rem',
          margin: '0'
        }}>
          Image Crop & Resize
        </h1>
        <p style={{ 
          color: '#666',
          fontSize: '1.1rem',
          margin: '10px 0 0 0'
        }}>
          Upload an image to get started
        </p>
      </header>
      
      <main style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <ImageUpload />
      </main>
      
      <footer style={{
        textAlign: 'center',
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e5e5',
        color: '#888',
        fontSize: '14px'
      }}>
        © {new Date().getFullYear()} Prodify Group AB. All rights reserved.
      </footer>
    </div>
  )
}

export default App

