export const onRequestPost: PagesFunction = async (context) => {
  try {
    const formData = await context.request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }), 
        { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }), 
        { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }), 
        { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // For MVP: just return file info without storing
    return new Response(
      JSON.stringify({ 
        success: true,
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      }), 
      { 
        headers: { 
          'content-type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Upload failed' }), 
      { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      }
    )
  }
}

