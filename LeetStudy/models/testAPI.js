import OpenAI from "openai/index.mjs";

const openai = new OpenAI({
    apiKey: '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'
})
console.log(openai)
const response = await openai.Completion.create({
          engine: 'text-davinci-003',  // GPT-3 model
          prompt: `Evaluate the following answer based on the question and score it from 0 to 100.\n\nQuestion: ${question}\nAnswer: ${playerAnswer}\nScore (0-100):`,
          max_tokens: 10,
          temperature: 0.0  // Set temperature to 0 for deterministic output
      });
console.log(response)