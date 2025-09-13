import { GoogleGenAI, Type } from "@google/genai";
import { Item } from '../types';

export interface BundleIdea {
    bundleName: string;
    description: string;
    itemNames: string[];
}

// FIX: Cast `import.meta` to `any` to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'" when accessing environment variables in Vite.
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.error("Gemini API key is not configured. AI features are disabled.");
}
const ai = new GoogleGenAI({ apiKey: apiKey! });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    bundleName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    itemNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            }
        }
    }
};

/**
 * Generates bundle ideas by calling the Google Gemini API directly from the client.
 * The API key is expected to be available in the execution environment as VITE_GEMINI_API_KEY.
 * @param items - A list of available individual items.
 * @returns A promise that resolves to an array of bundle ideas.
 */
export const generateBundleIdeas = async (items: Item[]): Promise<BundleIdea[]> => {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. AI features are disabled.");
    }
    if (items.length === 0) {
        return [];
    }

    const itemNames = items.map(item => item.arabicName).join(', ');
    const prompt = `Based on the following list of grocery and food items, generate 3 creative and appealing bundle ideas. For each bundle, provide a catchy Arabic name (bundleName), a short Arabic description, and a list of 2 to 4 item names (itemNames) from the provided list that would fit well together. The items are: ${itemNames}`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedResponse = JSON.parse(jsonString);
        return parsedResponse.ideas || [];

    } catch (error) {
        console.error("Error generating bundle ideas with Gemini:", error);
        throw new Error("Failed to generate bundle ideas. Please check your API key and network connection.");
    }
};