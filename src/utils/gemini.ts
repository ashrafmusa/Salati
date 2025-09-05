import { GoogleGenAI, Type } from "@google/genai";
import { Item } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

const bundleIdeaSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            description: "A list of 3 creative bundle ideas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    bundleName: {
                        type: Type.STRING,
                        description: "A catchy and descriptive name for the bundle in Arabic.",
                    },
                    description: {
                        type: Type.STRING,
                        description: "A short, appealing description for the bundle in Arabic.",
                    },
                    itemNames: {
                        type: Type.ARRAY,
                        description: "An array of item names from the provided list to be included in this bundle.",
                        items: {
                            type: Type.STRING,
                        },
                    },
                },
                required: ["bundleName", "description", "itemNames"],
            },
        },
    },
};

export interface BundleIdea {
    bundleName: string;
    description: string;
    itemNames: string[];
}

export const generateBundleIdeas = async (items: Item[]): Promise<BundleIdea[]> => {
    if (items.length === 0) {
        return [];
    }

    const itemNames = items.map(item => item.arabicName).join(', ');
    const prompt = `Based on the following list of available grocery items, generate 3 creative and appealing bundle ideas for an online store in Sudan. For each bundle, provide a name, a short description, and a list of items from the provided list. The items are: ${itemNames}.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: bundleIdeaSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedResponse = JSON.parse(jsonString);

        return parsedResponse.ideas || [];
    } catch (error) {
        console.error("Error generating bundle ideas with Gemini:", error);
        throw new Error("Failed to generate ideas. Please check the API key and try again.");
    }
};
