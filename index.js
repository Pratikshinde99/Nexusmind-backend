app.post("/hackrx/run", async (req, res) => {
  try {
    const { documents, questions } = req.body;

    if (!documents || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: "Invalid input format" });
    }

    const pdfRes = await axios.get(documents, {
      responseType: "arraybuffer",
      headers: {
        "Accept": "application/pdf"
      }
    });

    const data = await pdf(pdfRes.data);
    const text = data.text.replace(/\n/g, " ").replace(/\s+/g, " ");

    const answers = questions.map((q) => {
      const keywords = q.toLowerCase().split(" ").filter(w => w.length > 3);
      const sentences = text.split(". ");
      let best = "";
      let score = 0;
      for (let s of sentences) {
        let match = keywords.filter(k => s.toLowerCase().includes(k)).length;
        if (match > score) {
          score = match;
          best = s;
        }
      }
      return best.length > 20 ? best : "Answer not found in document";
    });

    return res.json({ answers });

  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(500).json({ error: "Failed to process PDF" });
  }
});
