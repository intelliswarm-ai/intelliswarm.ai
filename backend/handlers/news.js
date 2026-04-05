/**
 * News handlers.
 * Storage adapter is injected so the same logic works with
 * filesystem (Express) or DynamoDB (Lambda).
 *
 * Storage interface:
 *   getAll()           → NewsItem[]
 *   put(item)          → void
 */

async function handleGetNews(storage, query = {}) {
  try {
    let news = await storage.getAll();
    news.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (query.category) {
      news = news.filter((n) => n.category === query.category);
    }

    return { statusCode: 200, body: { news, total: news.length } };
  } catch (error) {
    console.error('News error:', error);
    return { statusCode: 500, body: { error: 'Failed to load news' } };
  }
}

async function handleCreateNews(storage, data) {
  try {
    const { id, date, category, title, summary, content, tags, link } = data;

    if (!title || !summary || !category) {
      return {
        statusCode: 400,
        body: { error: 'title, summary, and category are required' },
      };
    }

    const item = {
      id: id || `news-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      category,
      title,
      summary,
      content: content || summary,
      tags: tags || [],
      link: link || '',
    };

    await storage.put(item);
    return { statusCode: 200, body: { success: true, item } };
  } catch (error) {
    console.error('News create error:', error);
    return { statusCode: 500, body: { error: 'Failed to create news item' } };
  }
}

module.exports = { handleGetNews, handleCreateNews };
