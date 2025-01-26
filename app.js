const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.static(path.join(__dirname, 'public')));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    const form = new FormData();
    form.append('image', req.file.buffer, 'screenshot.png');

    const response = await axios.post('https://api.trace.moe/search?anilistInfo=true', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Anime-Identifier-App', 
      },
    });

    if (response.data.result && response.data.result.length > 0) {
      const result = response.data.result[0];
      const t = result.anilist && result.anilist.title 
        ? result.anilist.title.romaji || result.anilist.title.native || result.anilist.title.english || 'Unknown Title'
        : 'Unknown Title';



      return res.json({
        anime: {
          title:t,
          episode: result.episode || 'Unknown Episode',
          similarity: (result.similarity * 100).toFixed(2) + '%' || 'Unknown Similarity',
          videoUrl: result.video || '#',
        },
        message: 'Anime identified successfully!',
      });
    } else {
      return res.status(404).json({ error: 'Anime not found' });
    }
  } catch (error) {
    console.error('Error during API request:', error.response || error);
    return res.status(500).json({ error: 'Error identifying anime' });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
