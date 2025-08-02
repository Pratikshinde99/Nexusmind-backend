const express = require("express");
const axios = require("axios");
const pdf = require("pdf-parse");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

function cleanText(text) {
  return text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function extractAnswer(pdfText, question) {
  const keywords = question.toLowerCase().split(" ").filter(w => w.length > 3);
  const lines = pdfText.split(". ");
  
  let bestMatch = "";
  let maxMatches = 0;

  for (let line of lines) {
    let count = 0;
    const l = line.toLowerCase();
    for (let word of keywords) {
      if (l.includes(word)) count++;
    }
    if (count > maxMatches) {
      maxMatches = count;
      bestMatch = line;
    }
  }

  return bestMatch.length > 30 ? bestMatch.trim() : "Answer not found in document";
}

app.post("/hackrx/run", async (req, res) => {
  try {
    const { documents, questions } = req.body;

    if (!documents || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const pdfResponse = await axios.get(documents, {
      responseType: "arraybuffer",
    });

    const data = await pdf(pdfResponse.data);
    const text = cleanText(data.text);

    const answers = questions.map(q => extractAnswer(text, q));

    res.json({ answers });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 NexusMind AI webhook running on port ${PORT}`);
});
