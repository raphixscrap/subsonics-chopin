const { LogType } = require("loguix");
const plog = new LogType('Lyrics');
const urls = require('./urls.json');

// Make sure Url exists and get lyrics for the first item only
async function getLyrics(name) {
    let result = null;
    try {
        const searchResponse = await fetch(`${urls.urlSearch}${encodeURIComponent(name)}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        });
        const searchData = await searchResponse.json();

        // Check if data exists and has at least one item
        if (searchData && searchData.data && searchData.data.length > 0) {
            const firstItem = searchData.data[0];
            const artist = firstItem.artist && firstItem.artist.name ? firstItem.artist.name : null;
            const title = firstItem.title || null;

            if (artist && title) {
                try {
                    const lyricsResponse = await fetch(`${urls.urlGet}${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
                        method: 'GET',
                        headers: {
                            'content-type': 'application/json'
                        }
                    });
                    const lyricsData = await lyricsResponse.json();
                    console.log(lyricsData);
                    if (lyricsData && lyricsData && lyricsData.lyrics) {
                        result = lyricsData.lyrics;
                    } else {
                        plog.error('Invalid response structure:', lyricsData);
                        return null;
                    }
                } catch (error) {
                    plog.error('Error fetching lyrics data:', error);
                    return null;
                }
            } else {
                plog.error('Artist or title missing in search result');
                return null;
            }
        } else {
            plog.error('No search results found');
            return null;
        }
    } catch (error) {
        plog.error('Error fetching search data:', error);
        return null;
    }
    return result;
}

module.exports = { getLyrics };