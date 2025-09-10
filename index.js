import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import Message from './models/Message.js';
import Spotify from './utils/spotify.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3027;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect(process.env.MONGO_URI)

app.get('/', async (req, res) => {
    const messages = await Message.find().limit(10);
    res.render('index', { messages });
});

app.get('/submit', (req, res) => {
    const error = req.query.error || null;
    res.render('submit', { error });
});

app.get('/browse', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        let query = {};

        if (searchQuery) {
            query = {
                recipient: { $regex: searchQuery, $options: 'i' }
            };
        }

        const messages = await Message.find(query).sort({ createdAt: -1 }).limit(30);
        res.render('browse/index', { messages });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Error searching messages');
    }
});

app.get('/history', async (req, res) => {
    const slug = req.query.slug;

    let validSlug = false;

    if (slug) {
        const message = await Message.findOne({ slug });
        if (message) {
            validSlug = true;
        }
    }

    res.render('history', { slug: validSlug ? slug : null });
});

app.get('/support', async (req, res) => {
    res.render('support/index');
});

app.get('/details/:slug', async (req, res) => {
    const message = await Message.findOne({ slug: req.params.slug });
    if (!message) return res.status(404).send('Message not found');
    res.render('detail/index', { message });
});

app.post('/add', async (req, res) => {
    try {
        const { recipient, song, content } = req.body;
        const sender = req.body.sender || 'the sender';

        if (!recipient || !song || !content) {
            return res.redirect('/submit?error=required_fields');
        }

        if (recipient.length > 40 ||
            sender.length > 40 ||
            content.length > 500) {
            return res.redirect('/submit?error=field_too_long');
        }

        let parsedSong;
        try {
            parsedSong = JSON.parse(song);
        } catch (err) {
            return res.redirect('/submit?error=invalid_json');
        }

        if (!parsedSong.name || !parsedSong.artist) {
            return res.redirect('/submit?error=missing_song_info');
        }

        const message = await Message.create({
            sender,
            recipient,
            song: parsedSong,
            content
        });

        res.redirect(`/history?slug=${message.slug}`);
    } catch (error) {
        console.error(error);
        return res.redirect('/submit?error=server_error');
    }
});

app.get('/search-song', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Missing query' });

    const spotify = new Spotify();
    const searchResult = await spotify.search(q);
    if (!searchResult.success) {
        return res.status(404).json({ error: 'No songs found' });
    }

    const simplified = searchResult.result.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        image: track.album.images[1]?.url || track.album.images[0]?.url,
        url: track.external_urls.spotify
    }));

    res.json({ tracks: simplified });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
