const axios = require("axios");

const GEMINI_API_URL = process.env.AI_API_URL;
const GEMINI_API_KEY = process.env.AI_API_KEY;

// Summarize document
async function summarizeDoc(content) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: `Summarize the following in 3-4 sentences:\n\n${content}` }]
          }
        ]
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Summarize error:", err.response?.data || err.message);
    return "Summary not available.";
  }
}

// Generate tags
async function generateTags(content) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: `Extract 5-7 keywords as tags from this document:\n\n${content}` }]
          }
        ]
      }
    );
    const text = response.data.candidates[0].content.parts[0].text;
    return text.split(",").map(tag => tag.trim());
  } catch (err) {
    console.error("Tags error:", err.response?.data || err.message);
    return [];
  }
}

// Q&A using context
async function askQuestion(question, docs) {
  try {
    const context = docs.map(d => `${d.title}: ${d.content}`).join("\n\n");
    const prompt = `Use the following documents as context:\n${context}\n\nQuestion: ${question}`;
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Q&A error:", err.response?.data || err.message);
    return "Unable to answer.";
  }
}


// simple deterministic stub embedding (local fallback)
// Later you can replace with Gemini embedding API
function stubEmbed(text) {
  const dim = 64;
  const v = new Array(dim).fill(0);
  for (let i = 0; i < text.length && i < 2000; i++) {
    v[i % dim] += text.charCodeAt(i) % 10;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map(x => x / norm);
}

async function embed(content) {
  try {
    return stubEmbed(content);
  } catch (err) {
    console.error("Embed error:", err.message || err);
    return stubEmbed(content);
  }
}


module.exports = { summarizeDoc, generateTags, askQuestion, embed };
