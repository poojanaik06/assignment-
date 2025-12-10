// backend/routes/imageRouter.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';

const router = express.Router();

router.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const apiKey = process.env.GENERATIVE_API_KEY;
    if (!apiKey) {
      console.error('Missing GENAI_API_KEY environment variable');
      const fallback = `https://placehold.co/800x500?text=${encodeURIComponent(prompt)}`;
      return res.status(200).json({ imageUrl: fallback, note: 'fallback - no API key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: { numberOfImages: 4 },
    });

    // Support multiple possible response shapes
    const generated = response.generatedImages || response.generated_images || response.generated || [];
    if (!generated.length) {
      console.error('No images returned:', response);
      const fallbackUrl = `https://placehold.co/800x500?text=${encodeURIComponent(prompt)}`;
      return res.status(200).json({ imageUrl: fallbackUrl, note: 'fallback - no images returned' });
    }

    let idx = 1;
    for (const item of generated) {
      // common locations for base64 bytes used by different SDK versions:
      const b64 =
        item.image?.imageBytes ||
        item.image?.b64_json ||
        item.b64_json ||
        item.base64;
      if (!b64) {
        console.warn('Skipping entry without image bytes:', item);
        continue;
      }

      const buffer = Buffer.from(b64, 'base64');
      const filename = `imagen-${idx}.png`;
      await fs.writeFile(filename, buffer);
      console.log('Wrote', filename);
      idx++;
    }

    const imageUrl = `data:image/png;base64,${generated[0].image.imageBytes}`;
    return res.status(200).json({ imageUrl });
  } catch (err) {
    // log full error for debugging (stack when available)
    console.error('[Error] generate-image:', err?.stack || err?.message || err);
    // Provide helpful info but don't expose secrets
    const fallbackUrl = `https://placehold.co/800x500?text=${encodeURIComponent(req.body?.prompt || 'image')}`;
    return res.status(200).json({
      imageUrl: fallbackUrl,
      note: 'fallback due to upstream error (check backend logs)',
    });
  }
});

export default router;