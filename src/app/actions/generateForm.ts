"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function generateForm(
  prevState: { message: string },
  formData: FormData
) {
  const schema = z.object({
    description: z.string().min(1),
  });

  const parse = schema.safeParse({
    description: formData.get("description"),
  });

  if (!parse.success) {
    console.log(parse.error);
    return {
      message: "Failed to parse data",
    };
  }

  const data = parse.data;

  try {
    const prompt = `${data.description} Based on the description, generate a survey object with 3 fields: name(string) for the form, description(string) of the form and a questions array where every element has 2 fields: text and the fieldType and fieldType can be of these options RadioGroup, Select, Input, Textarea, Switch; and return it in json format. For RadioGroup, and Select types also return fieldOptions array with text and value fields. And more importantly, questions should be only 2 in number. For example, for RadioGroup, and Select types, the field options array can be [{text: 'Yes', value: 'yes'}, {text: 'No', value: 'no'}] and for Input, Textarea, and Switch types, the field options array can be empty.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonString = text.replace(/^```json\s*([\s\S]*)\s*```$/g, "$1");

    const responseObject = JSON.parse(jsonString);
    console.log("Generated Form Data", responseObject);

    revalidatePath("/");

    // Return success message along with the saved form ID
    return {
      message: "success",
      data: { formId: "dbFormId" },
    };
  } catch (err) {
    console.log(err);
    return {
      message: "Failed to create form",
    };
  }
}