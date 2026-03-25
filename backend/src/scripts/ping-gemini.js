import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use FREE + stable model
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

const pingGemini = async () => {
  try {
    console.log("🔌 Connecting to Gemini...");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: "Say 'Gemini Connected 🚀'" }]
        }
      ]
    });

    const response = result.response.text();

    console.log("✅ Connected successfully!");
    console.log("🤖 Response:", response);

    process.exit(0);

  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err.message);

    process.exit(1);
  }
};

pingGemini();