
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }

    const id = String(req.query.id || '');
    const type = String(req.query.type || '');

    if (!/^\d+$/.test(id) || !['movie', 'tv'].includes(type)) {
        return res.status(400).json({
            error: 'Invalid movie or series ID'
        });
    }

    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
        console.error('TMDB_API_KEY is not configured');
        return res.status(500).json({
            error: 'IMDb lookup is not configured'
        });
    }

    try {
        const url = new URL(
            `https://api.themoviedb.org/3/${type}/${id}/external_ids`
        );

        url.searchParams.set('api_key', apiKey);

        const response = await fetch(url);

        if (response.status === 404) {
            return res.status(404).json({
                error: 'Title not found'
            });
        }

        if (!response.ok) {
            console.error('TMDB lookup returned:', response.status);

            return res.status(502).json({
                error: 'IMDb lookup provider failed'
            });
        }

        const data = await response.json();

        return res.status(200).json({
            imdb_id: data.imdb_id || null
        });
    } catch (error) {
        console.error('IMDb lookup failed:', error);

        return res.status(500).json({
            error: 'Unable to retrieve IMDb ID'
        });
    }
};
