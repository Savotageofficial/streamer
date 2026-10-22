
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const id = String(req.query.id || '');
    const season = req.query.season;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Invalid TMDB series ID' });
    }

    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API not configured' });
    }

    try {
        // No season specified: return the available seasons.
        // Season specified: return episodes from that season.
        const path = season === undefined
            ? `/tv/${id}`
            : `/tv/${id}/season/${season}`;

        if (season !== undefined &&
            (!/^\d+$/.test(String(season)) ||
             Number(season) > 100)) {
            return res.status(400).json({ error: 'Invalid season' });
        }

        const url = new URL(`https://api.themoviedb.org/3${path}`);
        url.searchParams.set('api_key', apiKey);

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(502).json({
                error: 'Could not retrieve series information'
            });
        }

        const data = await response.json();

        if (season === undefined) {
            const seasons = (data.seasons || [])
                .filter(s => s.season_number >= 1)
                .map(s => ({
                    season_number: s.season_number,
                    name: s.name,
                    episode_count: s.episode_count
                }));

            return res.status(200).json({ seasons });
        }

        const episodes = (data.episodes || []).map(ep => ({
            episode_number: ep.episode_number,
            name: ep.name
        }));

        return res.status(200).json({ episodes });
    } catch (error) {
        console.error('Episode lookup failed:', error);
        return res.status(500).json({
            error: 'Unable to retrieve episodes'
        });
    }
};
