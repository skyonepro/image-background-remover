export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method === 'POST' && new URL(request.url).pathname === '/remove-bg') {
      const formData = await request.formData();
      const imageFile = formData.get('image');
      
      if (!imageFile) {
        return new Response('No image provided', { status: 400 });
      }

      const removeBgFormData = new FormData();
      removeBgFormData.append('image_file', imageFile);
      removeBgFormData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': env.REMOVE_BG_API_KEY,
        },
        body: removeBgFormData,
      });

      if (!response.ok) {
        return new Response('Background removal failed', { status: response.status });
      }

      const imageBuffer = await response.arrayBuffer();

      return new Response(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
