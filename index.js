const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const pdfParse = require('pdf-parse');

const app = express();
app.use(bodyParser.json());

const stopWords = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'for', 'to', 'of', 'in', 'that', 'it',
  'with', 'as', 'this', 'by', 'from', 'are', 'was', 'be', 'or', 'has', 'have', 'not'
]);

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

app.post('/hackrx/run', async (req, res) => {
  const { documents, questions } = req.body;

  if (!documents || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Fetch PDF buffer
    const pdfBuffer = (await axios.get(documents, { responseType: 'arraybuffer' })).data;

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Split text into paragraphs (chunks of text separated by 1+ empty lines)
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);

    const answers = questions.map(question => {
      const qKeywords = extractKeywords(question);

      let bestParagraph = '';
      let bestScore = 0;

      for (const para of paragraphs) {
        const paraLower = para.toLowerCase();
        // Count how many keywords appear in paragraph
        let score = 0;
        for (const kw of qKeywords) {
          if (paraLower.includes(kw)) {
            score++;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestParagraph = para;
        }
      }

      // If no paragraph matches well, return "Answer not found in document"
      if (bestScore === 0) {
        return "Answer not found in document";
      }
      return bestParagraph;
    });

    return res.json({ answers });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    return res.status(500).json({ error: 'Failed to process document' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook running on port ${PORT}`);
});
