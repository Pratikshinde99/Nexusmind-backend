const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const app = express();

app.use(bodyParser.json());

app.post('/hackrx/run', async (req, res) => {
  const { documents, questions } = req.body;

  if (!documents || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Download the PDF
    const pdfBuffer = (await axios.get(documents, { responseType: 'arraybuffer' })).data;

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Very simple keyword-based "answering"
    const answers = questions.map(q => {
      const match = text
        .split('\n')
        .find(line => line.toLowerCase().includes(q.toLowerCase().split(' ')[0]));

      return match ? match.trim() : 'Answer not found in document';
    });

    return res.status(200).json({ answers });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    return res.status(500).json({ error: 'Failed to process document' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook running on port ${PORT}`);
});
