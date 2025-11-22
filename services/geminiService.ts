import { GoogleGenAI } from "@google/genai";

export const queryGemini = async (prompt: string, country: string, location?: { latitude: number; longitude: number }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const tools: any[] = [
      { googleSearch: {} },
      { googleMaps: {} }
    ];

    const config: any = { tools };

    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      };
    }
    
    // We strictly prompt for verifiable sources to ensure precision.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert Tax Assistant for a specific country: ${country}.
      
      User Question: ${prompt}
      
      STRICT RULES:
      1. USE the Google Search tool to verify 2024/2025 tax rates, thresholds, and deductions.
      2. USE the Google Maps tool to find locations if the user asks (e.g. "Where is the tax office?", "Find accountants nearby").
      3. DO NOT hallucinate numbers. If uncertain, state that you cannot verify.
      4. Answer concisely with verifiable numeric data or specific location details.
      5. The response MUST be grounded in search results or map data.
      `,
      config: config,
    });

    // Extract text and grounding info
    let text = response.text || "";
    
    // Append citations if available from grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
        const uniqueLinks = new Map<string, string>();
        const mapLinks = new Map<string, string>();

        chunks.forEach((c: any) => {
            if (c.web?.uri && c.web?.title) {
                uniqueLinks.set(c.web.uri, c.web.title);
            }
            if (c.maps?.uri && c.maps?.title) {
                mapLinks.set(c.maps.uri, c.maps.title);
            }
        });

        if (uniqueLinks.size > 0) {
            text += `\n\n**Verified Sources:**\n`;
            uniqueLinks.forEach((title, uri) => {
                text += `- [${title}](${uri})\n`;
            });
        }

        if (mapLinks.size > 0) {
            text += `\n\n**Relevant Locations:**\n`;
            mapLinks.forEach((title, uri) => {
                text += `- [${title}](${uri})\n`;
            });
        }
    }

    return text || "I couldn't verify that information. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error verifying the data. Please check your connection and try again.";
  }
};