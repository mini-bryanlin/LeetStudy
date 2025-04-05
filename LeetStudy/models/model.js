const openai = require('openai');



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
