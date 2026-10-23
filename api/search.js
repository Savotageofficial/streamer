
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }

    const query = String(req.query.q || '').trim();

    if (query.length < 2 || query.length > 100) {
        return res.status(400).json({
            error: 'Search must be between 2 and 100 characters'
        });
    }

    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
        console.error('TMDB_API_KEY is not configured');
        return res.status(500).json({
            error: 'Search service is not configured'
        });
    }

    try {
        const url = new URL(
            'https://api.themoviedb.org/3/search/movie'
        );

        url.searchParams.set('api_key', apiKey);
        url.searchParams.set('query', query);
        url.searchParams.set('include_adult', 'false');

        const response = await fetch(url);

        if (!response.ok) {
            console.error('TMDB search returned:', response.status);

            return res.status(502).json({
                error: 'Movie search provider failed'
            });
        }

        const data = await response.json();

        const results = (data.results || []).slice(0, 10);

        res.setHeader('Cache-Control', 'public, max-age=30');

        return res.status(200).json({ results });
    } catch (error) {
        console.error('Search function failed:', error);

        return res.status(500).json({
            error: 'Unable to search right now'
        });
    }
};
