
import { GoogleGenAI, Modality } from "@google/genai";

export const queryGemini = async (prompt: string, country: string): Promise<string> => {
  try {
    // Fix: Use process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using googleSearch tool for grounding as per requirements
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a helpful Tax Assistant for a Pay Calculator app. 
      The user is asking about taxes in ${country}.
      
      User Question: ${prompt}
      
      Please provide a concise answer using the Google Search tool to get the latest 2024/2025 data.
      Include numeric values where possible.
      Always cite your sources at the end.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract text and grounding info
    let text = response.text;
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
        const links = chunks
            .map((c: any) => c.web?.uri ? `[${c.web.title || 'Source'}](${c.web.uri})` : null)
            .filter(Boolean)
            .join('\n');
        
        if (links) {
            text += `\n\n**Sources found:**\n${links}`;
        }
    }

    return text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't fetch the latest tax info right now. Please try again later.";
  }
};

export const editImageWithGemini = async (base64Image: string, prompt: string, mimeType: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image, 
              mimeType: mimeType, 
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE], 
      },
    });
    
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
        return part.inlineData.data;
    }
    return null;
  } catch (error) {
      console.error("Gemini Image Edit Error:", error);
      return null;
  }
};
