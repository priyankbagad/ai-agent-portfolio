export async function searchKnowledge(query) {
  try {
    // Step 1: Embed the query via Voyage AI
    const embedResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REACT_APP_VOYAGE_KEY}`,
      },
      body: JSON.stringify({ input: [query], model: 'voyage-3' }),
    });
    const embedData = await embedResponse.json();
    const queryEmbedding = embedData.data[0].embedding;
    console.log('Query embedding length:', queryEmbedding.length);

    // Step 2: Vector search via local proxy
    const response = await fetch('http://localhost:3001/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedding: queryEmbedding }),
    });

    const chunks = await response.json();
    console.log('RAG chunks:', chunks);

    if (!chunks || chunks.length === 0) return '';
    return chunks.map(c => c.content).join('\n\n');
  } catch (err) {
    console.error('searchKnowledge error:', err);
    return '';
  }
}
