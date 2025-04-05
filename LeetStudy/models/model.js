const openai = require('openai');
openai.apiKey = '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';


// Create an OpenAI instance


async function evaluateAnswer(question, playerAnswer) {
    try {
        const response = await openai.completions.create({
            model: 'text-davinci-003',  // GPT-3 model
            prompt: `Evaluate the following answer based on the question and score it from 0 to 100.\n\nQuestion: ${question}\nAnswer: ${playerAnswer}\nScore (0-100):`,
            max_tokens: 10,
            temperature: 0.0,  // Set temperature to 0 for deterministic output
        });

        console.log(response.choices[0].text.trim()); // Display the evaluated score from OpenAI
    } catch (error) {
        console.error('Error evaluating answer:', error);
    }
}

// Example usage
const question = "What is the capital of France?";
const playerAnswer = "Paris";
evaluateAnswer(question, playerAnswer);
