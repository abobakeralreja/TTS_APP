const googleTTS = require('google-tts-api');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: "error", message: "Method Not Allowed" });
    }

    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.status(400).json({ status: "error", message: "Text is required" });
    }

    try {
        // Generate audio URL
        const url = googleTTS.getAudioUrl(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });

        // Proxy the audio stream so the browser doesn't face CORS or "not supported" source issues
        const audioResponse = await fetch(url);

        if (!audioResponse.ok) {
            throw new Error(`Google TTS API responded with status: ${audioResponse.status}`);
        }

        const arrayBuffer = await audioResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Send the audio file as a direct stream response
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        return res.status(200).send(buffer);

    } catch (error) {
        console.error("TTS Error:", error);
        return res.status(500).json({ status: "error", message: "Error generating audio" });
    }
}
