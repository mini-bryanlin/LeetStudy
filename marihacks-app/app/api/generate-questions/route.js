import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import OpenAI from 'openai';
// Don't import PDF.js directly as it may cause issues with canvas
// import pdfjsLib from 'pdfjs-dist/build/pdf';
import connectToDatabase from '@/lib/mongodb';

// Initialize Room model dynamically to avoid Next.js issues
let Room;

// Define environment variables for OpenAI and Hugging Face API
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const hf = {
  apiKey: HF_API_KEY,
  apiUrl: 'https://api-inference.huggingface.co/models',
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to extract text from various file types
async function extractTextFromFile(file) {
  const fileType = file.name.split('.').pop().toLowerCase();
  
  try {
    // Handle different file types
    switch (fileType) {
      case 'pdf':
        // Simple direct extraction without external libraries
        console.log(`Processing PDF file: ${file.name}`);
        
        try {
          // Extract text directly from the buffer
          const buffer = await file.arrayBuffer();
          const pdfText = Buffer.from(buffer).toString('utf8');
          
          console.log(`Got ${pdfText.length} chars of raw PDF data`);
          
          // Extract anything that looks like text (alpha sequences with spaces)
          const textFragments = [];
          const textPattern = /[A-Za-z][A-Za-z0-9\s.,;:'"(){}\[\]-]{8,}/g;
          let match;
          
          // Find all matches using the regex
          while ((match = textPattern.exec(pdfText)) !== null) {
            if (match[0].length > 10 && match[0].length < 500 && match[0].includes(' ')) {
              textFragments.push(match[0].trim());
            }
          }
          
          console.log(`Extracted ${textFragments.length} text fragments from PDF`);
          
          // Join fragments into a single text
          const combinedText = textFragments.join('\n');
          
          // Clean up the text
          const cleanedText = combinedText
            .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ') // Remove control chars
            .replace(/\s+/g, ' ')                   // Normalize whitespace
            .trim();
          
          console.log(`After cleaning: ${cleanedText.length} chars`);
          
          // If we have a reasonable amount of text, return it
          if (cleanedText.length > 100) {
            return cleanedText;
          }
          
          // If text is too short, try one more approach - look for any words
          console.log("First approach yielded limited text, trying backup method");
          
          // Look for any words that could be content
          const wordPattern = /[A-Za-z]{4,}/g;
          const words = Array.from(new Set(pdfText.match(wordPattern) || []));
          
          if (words.length > 50) {
            console.log(`Extracted ${words.length} unique words from PDF`);
            return words.join(' ');
          }
          
          // Last resort - just return something based on the filename
          console.log("⚠️ All extraction methods failed, using filename-based fallback");
          return `Content from ${file.name}. This appears to be related to ${file.name.split('.')[0].replace(/[_-]/g, ' ')}.`;
          
        } catch (error) {
          console.error('Error in PDF processing:', error);
          return `Content from ${file.name}. This appears to be related to ${file.name.split('.')[0].replace(/[_-]/g, ' ')}.`;
        }
        
      // ... rest of the existing cases ...
    }
    // ... rest of the function ...
  } catch (error) {
    console.error('Error extracting text from file:', error);
    // Emergency fallback - return something rather than nothing
    return `File content from ${file.name}. This appears to be related to ${file.name.split('.')[0].replace(/[_-]/g, ' ')}.`;
  }
}

// Helper function to clean and structure slide content
function cleanSlideContent(text) {
  // Initial cleaning
  let cleaned = text
    // Remove common metadata and formatting
    .replace(/<[^>]*>|<\/[^>]*>/g, ' ')
    .replace(/xmlns:[a-z0-9]+="[^"]*"/gi, ' ')
    .replace(/http:\/\/[^\s]*/g, ' ')
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\\[a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract slide markers using more comprehensive patterns - commonly used in slides
  // Look for Slide title patterns
  const slideHeaderPattern = /(?:slide|page|chapter|section)(?:\s*\d+|\s*[:.\-]|\s+title\s*:|\s+header\s*:)?[^.,;!?]*(?:[.,;!?]|$)/gi;
  const slideHeaders = cleaned.match(slideHeaderPattern) || [];
  
  // Look for bullet points which are common in slides
  const bulletPointsPattern = /(?:[-•*+]\s+|\s*\d+\.\s+)([A-Za-z].*?)(?=$|\n)/gm;
  const bulletPoints = cleaned.match(bulletPointsPattern) || [];
  
  // Extract text that looks like potential headings (ALL CAPS or Title Case)
  const headingsPattern = /(?:^|\n|\s{2,})([A-Z][A-Z\s]{2,}[A-Z]|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})(?:\n|$|\s{2,})/g;
  const headings = [];
  let match;
  while ((match = headingsPattern.exec(cleaned)) !== null) {
    if (match[1] && match[1].length > 5 && match[1].length < 100) { // Avoid too short or too long
      headings.push(match[1].trim());
    }
  }
  
  // Look for definitions (common in educational slides)
  const definitionPattern = /[A-Z][a-zA-Z\s]{3,}(?:\s*[-:–]\s*|\s+is\s+|\s+are\s+|\s+means\s+)[^.!?]*[.!?]/g;
  const definitions = cleaned.match(definitionPattern) || [];
  
  // Extract what appears to be full sentences with adequate length
  const sentencePattern = /[A-Z][^.!?]{15,}[.!?]/g;
  const sentences = cleaned.match(sentencePattern) || [];
  
  // Combine everything into a structured content format
  let structuredContent = '';
  
  if (slideHeaders.length > 0) {
    structuredContent += 'SLIDE TITLES:\n' + slideHeaders.map(h => '- ' + h.trim()).join('\n') + '\n\n';
  }
  
  if (headings.length > 0) {
    structuredContent += 'MAIN TOPICS:\n' + headings.map(h => '- ' + h.trim()).join('\n') + '\n\n';
  }
  
  if (bulletPoints.length > 0) {
    structuredContent += 'KEY POINTS:\n' + bulletPoints.map(p => '- ' + p.trim()).join('\n') + '\n\n';
  }
  
  if (definitions.length > 0) {
    structuredContent += 'DEFINITIONS:\n' + definitions.map(d => '- ' + d.trim()).join('\n') + '\n\n';
  }
  
  if (sentences.length > 0) {
    // Sort sentences by length - often longer sentences contain more information
    const significantSentences = sentences
      .filter(s => s.length > 30 && s.length < 200)
      .filter(s => !s.includes('uuid') && !s.includes('xmlns'))
      .slice(0, 30);
    
    if (significantSentences.length > 0) {
      structuredContent += 'CONTENT DETAILS:\n' + significantSentences.map(s => s.trim()).join('\n') + '\n\n';
    }
  }
  
  // As a fallback, include the raw cleaned text but chunked into paragraphs
  if (structuredContent.length < 200) {
    console.log('Structured content too short, using chunked text');
    
    // Break text into chunks and append the most promising ones
    const chunks = cleaned.split(/\s{2,}/).filter(chunk => chunk.length > 50);
    if (chunks.length > 0) {
      structuredContent += 'SLIDE CONTENT:\n' + chunks.slice(0, 20).join('\n\n');
    } else {
      structuredContent += 'SLIDE TEXT:\n' + cleaned;
    }
  }
  
  console.log(`Slide content structured: ${structuredContent.length} characters`);
  return structuredContent;
}

// Simplified question generation
async function generateQuestionsWithFallback(content, subject, difficulty, questionCount) {
  try {
    console.log('Generating questions with primary method...');
    
    // Clean the content to focus on the most useful information
    const cleanedContent = cleanContentForQuestionGeneration(content);
    console.log(`Cleaned content length: ${cleanedContent.length} characters`);
    
    // If content is too short after cleaning, fall back to subject questions
    if (cleanedContent.length < 200) {
      console.log('Cleaned content too short, using subject questions');
      return getSubjectSpecificQuestions(subject, questionCount);
    }
    
    // Create a strict prompt that focuses exclusively on slide content
    const prompt = `
You are creating a quiz EXCLUSIVELY based on the following slides content. You MUST STRICTLY follow these rules:

RULES:
1. ONLY generate questions about information EXPLICITLY stated in the content below.
2. DO NOT include ANY information, facts, concepts or knowledge that is NOT directly present in the slides.
3. DO NOT make up ANY additional details, facts, or information.
4. ONLY refer to material that ACTUALLY appears in the provided content.
5. If there is not enough content to create ${questionCount} good questions, create fewer questions rather than inventing information.
6. Each question must have exactly 4 options.
7. The correct answer MUST be the first option (index 0) and MUST be clearly supported by the slide content.
8. IGNORE any knowledge you have about the subject that is not present in the provided content.
9. IMPORTANT: Generate DIFFERENT, VARIED questions each time. Do not focus on the same content repeatedly.
10. RANDOMIZE which parts of the content you focus on for questions.

SLIDES CONTENT:
${cleanedContent}

RESPONSE FORMAT:
Return a JSON array of question objects with the structure:
[
  {
    "question": "Question text that ONLY asks about information in the slides",
    "options": ["Correct answer from slides", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
    "correctAnswer": 0
  },
  ...more questions...
]`;

    // Call the AI to generate questions based on the content
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a teacher creating unique, varied quiz questions based EXCLUSIVELY on the provided slide content. You must NEVER include information not present in the slides. Generate different questions each time by randomizing which content you focus on.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7, // Higher temperature for more variability
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    // Parse the response
    const aiResponse = response.choices[0].message.content;
    console.log('AI generated a response');
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      
      // Ensure the response contains a valid questions array
      if (Array.isArray(parsedResponse) || (parsedResponse.questions && Array.isArray(parsedResponse.questions))) {
        const questionsArray = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.questions;
        
        // Validate each question
        const validQuestions = questionsArray.filter(q => 
          q && 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 &&
          q.correctAnswer === 0  // Ensure correct answer is always at index 0
        );
        
        if (validQuestions.length >= questionCount / 2) {
          console.log(`Successfully generated ${validQuestions.length} valid questions from content`);
          return validQuestions.slice(0, questionCount);
        } else {
          console.log(`Not enough valid questions (${validQuestions.length}), trying fallback method`);
        }
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }
    
    // If we reach here, the primary method failed, try a simplified approach
    return await generateSimplifiedQuestions(cleanedContent, subject, difficulty, questionCount);
    
  } catch (error) {
    console.error('Error generating questions from content:', error);
    
    // Final fallback to subject-specific questions
    console.log('Error in question generation, using subject questions as last resort');
    return getSubjectSpecificQuestions(subject, questionCount);
  }
}

// Helper function to clean content for better question generation
function cleanContentForQuestionGeneration(content) {
  if (!content) return '';
  
  console.log('Cleaning and structuring content for question generation');
  
  // Split into lines and filter out noise
  let lines = content.split('\n').map(line => line.trim());
  
  // More aggressive filtering of noise
  lines = lines.filter(line => {
    // Skip empty lines
    if (!line) return false;
    
    // Skip lines that are too short
    if (line.length < 5) return false;
    
    // Skip lines that appear to be just URLs, file paths, or emails
    if (line.startsWith('http') || 
        line.match(/^([a-z]:\\|\/)/i) || 
        line.match(/^[\w.-]+@[\w.-]+\.\w+$/)) return false;
    
    // Skip lines that are just numbers, dates, or page numbers
    if (line.match(/^\d+(\.\d+)?$/) || 
        line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/) ||
        line.match(/^page\s+\d+$/i) ||
        line.match(/^\d+\s+of\s+\d+$/)) return false;
    
    // Skip common PDF metadata and technical markers
    if (line.includes('xmp:') || 
        line.includes('pdf:') || 
        line.includes('uuid:') ||
        line.includes('xmlns:') ||
        line.includes('adobe:') ||
        line.includes('©') ||
        line.includes('trademark') ||
        line.includes('copyright') ||
        line.match(/^\s*\{\s*[A-Za-z]+:/)) return false;
    
    // Skip watermarks and common footer text
    if (line.toLowerCase().includes('confidential') ||
        line.toLowerCase().includes('do not distribute') ||
        line.toLowerCase().includes('all rights reserved') ||
        line.match(/^created with/i) ||
        line.match(/^powered by/i)) return false;
    
    // Skip lines that are likely formatting artifacts
    if (line.length < 15 && line.match(/^[^a-z]+$/i)) return false;
    
    return true;
  });
  
  // If we already have structured slide content (from cleanSlideContent), prioritize that
  if (content.includes('SLIDE TITLES:') || content.includes('MAIN TOPICS:')) {
    console.log('Using pre-structured slide content');
    return content;
  }
  
  // Log how many lines remained after filtering
  console.log(`Filtered down to ${lines.length} meaningful content lines`);
  
  // Otherwise, build a simplified structure
  let structuredContent = '';
  
  // Extract slide titles and numbers
  const slideTitles = lines.filter(line => 
    line.toLowerCase().includes('slide') || 
    line.match(/^(chapter|section|topic|lecture|#)\s+\d+/i) ||
    (line.match(/^\d+\./) && line.length < 50 && line.split(' ').length < 8)
  );
  
  // Extract bullet points
  const bulletPoints = lines.filter(line => 
    line.startsWith('•') || 
    line.startsWith('-') || 
    line.startsWith('*') ||
    line.startsWith('→') ||
    line.startsWith('✓') ||
    line.match(/^\d+\.\s+\w+/) ||
    (line.startsWith('   ') && line.trim().length > 20)
  );
  
  // Extract what appear to be headings (ALL CAPS or Title Case)
  const headings = lines.filter(line => 
    ((line === line.toUpperCase() && line.length > 5 && line.length < 60) ||
    (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/) && !slideTitles.includes(line))) &&
    !bulletPoints.includes(line)
  );
  
  // Extract definitions (often structured as "Term: Definition")
  const definitions = lines.filter(line =>
    line.match(/^[A-Z][a-zA-Z\s]{1,20}:\s+.{10,}/) &&
    !headings.includes(line) &&
    !slideTitles.includes(line) &&
    !bulletPoints.includes(line)
  );
  
  // Add the structured content sections if they have content
  if (slideTitles.length > 0) {
    structuredContent += 'SLIDE TITLES:\n' + slideTitles.join('\n') + '\n\n';
  }
  
  if (headings.length > 0) {
    structuredContent += 'MAIN TOPICS:\n' + headings.join('\n') + '\n\n';
  }
  
  if (bulletPoints.length > 0) {
    structuredContent += 'KEY POINTS:\n' + bulletPoints.join('\n') + '\n\n';
  }
  
  if (definitions.length > 0) {
    structuredContent += 'DEFINITIONS:\n' + definitions.join('\n') + '\n\n';
  }
  
  // Include a selection of the longest, most information-rich lines
  // These are likely to be full sentences or paragraphs with actual content
  const contentLines = lines
    .filter(line => line.length > 20 && line.length < 500)
    .filter(line => line.includes(' ') && (line.includes('.') || line.includes('?') || line.includes('!')))
    .filter(line => !slideTitles.includes(line) && !bulletPoints.includes(line) && !headings.includes(line) && !definitions.includes(line))
    // Sort by information density (length and punctuation count as indicators)
    .sort((a, b) => {
      const aScore = a.length + (a.match(/[.,;:?!]/g) || []).length * 5;
      const bScore = b.length + (b.match(/[.,;:?!]/g) || []).length * 5;
      return bScore - aScore;
    })
    .slice(0, 30);
  
  if (contentLines.length > 0) {
    structuredContent += 'CONTENT DETAILS:\n' + contentLines.join('\n') + '\n';
  }
  
  // If structured content is too short, fall back to the original filtered content
  if (structuredContent.length < 200) {
    console.log('Structured content too short, using cleaned raw content');
    return lines.join('\n');
  }
  
  console.log(`Structured content generated: ${structuredContent.length} characters`);
  return structuredContent;
}

// Simplified approach for question generation
async function generateSimplifiedQuestions(content, subject, difficulty, questionCount) {
  try {
    console.log('Using simplified question generation approach...');
    
    // Extract key bullet points or important sentences
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 10);
    const keyPoints = lines
      .filter(line => 
        line.startsWith('•') || 
        line.startsWith('-') || 
        line.startsWith('*') || 
        (line.includes('.') && line.length > 30 && line.length < 200)
      )
      .slice(0, 20);
    
    if (keyPoints.length < 3) {
      console.log('Not enough key points found for simplified generation');
      return getSubjectSpecificQuestions(subject, questionCount);
    }
    
    const simplifiedPrompt = `
Create multiple-choice questions based EXCLUSIVELY on these key points from slides. You MUST follow these rules:

RULES:
1. ONLY generate questions about information EXPLICITLY contained in these key points.
2. DO NOT include ANY information, facts, or concepts not directly present in these points.
3. DO NOT make up ANY additional details, facts, or information.
4. Each question must be directly based on these points ONLY.
5. If you cannot create ${questionCount} quality questions from this content, create fewer.
6. Each question must have 4 options where the correct answer is always the first option (index 0).
7. IGNORE any knowledge you have about the subject that is not in the provided points.
8. IMPORTANT: Generate DIFFERENT questions with VARIETY. Randomize which key points you focus on.

KEY POINTS FROM SLIDES:
${keyPoints.join('\n')}

Return a JSON array with this structure: [{"question": "...", "options": ["Correct answer from slides", "Wrong option 1", "Wrong option 2", "Wrong option 3"], "correctAnswer": 0}, ...]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are creating varied, unique quiz questions based EXCLUSIVELY on the provided slide content. You must NEVER include information not present in the slides and must generate different questions each time.' 
        },
        { role: 'user', content: simplifiedPrompt }
      ],
      temperature: 0.7, // Higher temperature for more randomness and variety
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const aiResponse = response.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      const questionsArray = Array.isArray(parsedResponse) ? parsedResponse : 
                            (parsedResponse.questions ? parsedResponse.questions : []);
      
      if (questionsArray.length > 0) {
        console.log(`Generated ${questionsArray.length} questions with simplified approach`);
        return questionsArray.slice(0, questionCount);
      }
    } catch (error) {
      console.error('Error parsing simplified questions response:', error);
    }
    
    // If we get here, even the simplified approach failed
    return getSubjectSpecificQuestions(subject, questionCount);
  } catch (error) {
    console.error('Error in simplified question generation:', error);
    return getSubjectSpecificQuestions(subject, questionCount);
  }
}

// Get high-quality subject-specific questions
function getSubjectSpecificQuestions(subject, count = 5) {
  console.log(`Getting ${count} high-quality questions for ${subject}`);
  
  // Subject-specific templates with real educational content
  const subjects = {
    "Mathematics": [
      {
        question: "Which mathematical concept is used to solve equations with multiple variables?",
        options: ["Linear Algebra", "Calculus", "Geometry", "Statistics"],
        correctAnswer: 0
      },
      {
        question: "What is the derivative of a constant function?",
        options: ["Zero", "One", "Infinity", "The constant itself"],
        correctAnswer: 0
      },
      {
        question: "Which theorem relates the sides of a right-angled triangle?",
        options: ["Pythagorean Theorem", "Fermat's Last Theorem", "Binomial Theorem", "Law of Cosines"],
        correctAnswer: 0
      },
      {
        question: "What is the value of π (pi) rounded to two decimal places?",
        options: ["3.14", "3.16", "3.12", "3.18"],
        correctAnswer: 0
      },
      {
        question: "Which of the following is an example of a prime number?",
        options: ["17", "21", "15", "9"],
        correctAnswer: 0
      },
      {
        question: "In probability theory, what is the sum of all probabilities in a sample space?",
        options: ["1", "0", "Infinity", "Depends on the experiment"],
        correctAnswer: 0
      }
    ],
    "Physics": [
      {
        question: "Which law states that the force acting on an object is equal to its mass times its acceleration?",
        options: ["Newton's Second Law", "Newton's First Law", "Law of Conservation of Energy", "Coulomb's Law"],
        correctAnswer: 0
      },
      {
        question: "What is the SI unit of force?",
        options: ["Newton", "Joule", "Watt", "Pascal"],
        correctAnswer: 0
      },
      {
        question: "Which type of energy is associated with motion?",
        options: ["Kinetic energy", "Potential energy", "Thermal energy", "Nuclear energy"],
        correctAnswer: 0
      },
      {
        question: "What is the speed of light in a vacuum?",
        options: ["3.00 × 10⁸ m/s", "3.00 × 10⁷ m/s", "3.00 × 10⁶ m/s", "3.00 × 10⁹ m/s"],
        correctAnswer: 0
      },
      {
        question: "Which physical phenomenon explains the bending of light when it passes from one medium to another?",
        options: ["Refraction", "Reflection", "Diffraction", "Scattering"],
        correctAnswer: 0
      }
    ],
    "Chemistry": [
      {
        question: "What is the most abundant element in the Earth's atmosphere?",
        options: ["Nitrogen", "Oxygen", "Carbon Dioxide", "Hydrogen"],
        correctAnswer: 0
      },
      {
        question: "Which type of bond involves the sharing of electron pairs between atoms?",
        options: ["Covalent bond", "Ionic bond", "Hydrogen bond", "Metallic bond"],
        correctAnswer: 0
      },
      {
        question: "What is the pH of a neutral solution at 25°C?",
        options: ["7", "0", "14", "1"],
        correctAnswer: 0
      },
      {
        question: "Which element has the chemical symbol 'Fe'?",
        options: ["Iron", "Fluorine", "Francium", "Fermium"],
        correctAnswer: 0
      },
      {
        question: "What is the main component of natural gas?",
        options: ["Methane", "Propane", "Butane", "Ethane"],
        correctAnswer: 0
      }
    ],
    "Biology": [
      {
        question: "Which organelle is responsible for protein synthesis in cells?",
        options: ["Ribosome", "Mitochondria", "Nucleus", "Golgi apparatus"],
        correctAnswer: 0
      },
      {
        question: "What process do plants use to convert sunlight into energy?",
        options: ["Photosynthesis", "Respiration", "Fermentation", "Transpiration"],
        correctAnswer: 0
      },
      {
        question: "Which of the following is NOT a nucleotide found in DNA?",
        options: ["Uracil", "Adenine", "Guanine", "Cytosine"],
        correctAnswer: 0
      },
      {
        question: "What is the basic unit of structure and function in all living organisms?",
        options: ["Cell", "Tissue", "Atom", "Molecule"],
        correctAnswer: 0
      },
      {
        question: "Which blood type is considered the universal donor?",
        options: ["O negative", "AB positive", "A positive", "B negative"],
        correctAnswer: 0
      }
    ],
    "Computer Science": [
      {
        question: "Which data structure operates on a First-In-First-Out principle?",
        options: ["Queue", "Stack", "Tree", "Heap"],
        correctAnswer: 0
      },
      {
        question: "What is the time complexity of binary search?",
        options: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"],
        correctAnswer: 0
      },
      {
        question: "Which programming paradigm treats computation as the evaluation of mathematical functions?",
        options: ["Functional programming", "Object-oriented programming", "Procedural programming", "Event-driven programming"],
        correctAnswer: 0
      },
      {
        question: "Which of the following is NOT a common sorting algorithm?",
        options: ["Quantum sort", "Bubble sort", "Merge sort", "Quick sort"],
        correctAnswer: 0
      },
      {
        question: "What does HTTP stand for?",
        options: ["Hypertext Transfer Protocol", "Hypertext Transfer Process", "Hypertext Transit Protocol", "High-level Transfer Protocol"],
        correctAnswer: 0
      }
    ],
    "History": [
      {
        question: "In which year did World War II end?",
        options: ["1945", "1939", "1918", "1941"],
        correctAnswer: 0
      },
      {
        question: "Who was the first President of the United States?",
        options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"],
        correctAnswer: 0
      },
      {
        question: "Which ancient civilization built the pyramids at Giza?",
        options: ["Egyptian", "Greek", "Roman", "Mesopotamian"],
        correctAnswer: 0
      },
      {
        question: "The Renaissance period originated in which country?",
        options: ["Italy", "France", "England", "Germany"],
        correctAnswer: 0
      },
      {
        question: "Which event marked the beginning of World War I?",
        options: ["Assassination of Archduke Franz Ferdinand", "German invasion of Poland", "Sinking of the Lusitania", "Russian Revolution"],
        correctAnswer: 0
      }
    ]
  };
  
  // Get subject-specific questions or default to generic ones
  const subjectQuestions = subjects[subject] || subjects["Mathematics"];
  
  // Make sure we have enough questions
  const result = [...subjectQuestions];
  
  // If we need more questions than available in the subject, use questions from other subjects
  if (result.length < count) {
    const otherSubjects = Object.keys(subjects).filter(s => s !== subject);
    let i = 0;
    
    while (result.length < count) {
      const randomSubject = subjects[otherSubjects[i % otherSubjects.length]];
      const randomQuestion = randomSubject[i % randomSubject.length];
      result.push({...randomQuestion});
      i++;
    }
  }
  
  // Return only the requested number
  return result.slice(0, count);
}

// Function specialized for extracting content from keynote/presentation files
async function extractPresentationContent(file) {
  const fileBuffer = await file.arrayBuffer();
  
  // Log file details for debugging
  console.log(`Extracting presentation content from: ${file.name}, size: ${(fileBuffer.byteLength / 1024).toFixed(1)}KB`);
  
  try {
    // First attempt: try to find text content in the binary
    // Presentation files sometimes have strings embedded that we can extract
    const binText = Buffer.from(fileBuffer).toString('utf8');
    
    // Store all extracted content
    const allContent = [];
    
    // Check if file appears to contain XML (common in keynote/pptx)
    const hasXmlContent = binText.includes('<?xml') || 
                         binText.includes('<pres') || 
                         binText.includes('<presentation') ||
                         binText.includes('<slide') ||
                         binText.includes('<p:presentation');
    
    if (hasXmlContent) {
      console.log('Presentation appears to contain XML content, extracting...');
      
      // Extract text from XML-like content using regex for common text patterns
      const xmlTextRegex = /<(?:text|t|a:t|p:txBody)[^>]*>(.*?)<\/(?:text|t|a:t|p:txBody)>/g;
      const xmlMatches = [...binText.matchAll(xmlTextRegex)].map(match => match[1]);
      
      if (xmlMatches.length > 0) {
        console.log(`Found ${xmlMatches.length} text elements in XML`);
        allContent.push(...xmlMatches);
      }
      
      // Look for title elements
      const titleRegex = /<(?:title|p:title|a:title)[^>]*>(.*?)<\/(?:title|p:title|a:title)>/g;
      const titleMatches = [...binText.matchAll(titleRegex)].map(match => match[1]);
      
      if (titleMatches.length > 0) {
        console.log(`Found ${titleMatches.length} title elements in XML`);
        allContent.push(...titleMatches);
      }
    }
    
    // Look for text blocks that might contain slide content
    const textBlocks = [];
    const potentialContentRegex = /[A-Z][A-Za-z ]{10,}(?:\.|:)/g;
    const contentMatches = binText.match(potentialContentRegex) || [];
    
    if (contentMatches.length > 0) {
      console.log(`Found ${contentMatches.length} potential text blocks in presentation`);
      textBlocks.push(...contentMatches);
      allContent.push(...contentMatches);
    }
    
    // Look for bullet points which are common in presentations
    const bulletPointRegex = /[•○◦▪▫■□→-]\s*[A-Za-z][A-Za-z ]{5,}/g;
    const bulletMatches = binText.match(bulletPointRegex) || [];
    
    if (bulletMatches.length > 0) {
      console.log(`Found ${bulletMatches.length} potential bullet points in presentation`);
      textBlocks.push(...bulletMatches);
      allContent.push(...bulletMatches);
    }
    
    // Look for slide titles
    const slideTitleRegex = /(?:Slide|SLIDE)[^a-zA-Z0-9]{0,3}[0-9]+[^a-zA-Z0-9]{0,3}[A-Za-z].*?(?:\n|$)/g;
    const titleMatches = binText.match(slideTitleRegex) || [];
    
    if (titleMatches.length > 0) {
      console.log(`Found ${titleMatches.length} potential slide titles in presentation`);
      textBlocks.push(...titleMatches);
      allContent.push(...titleMatches);
    }
    
    // If we found some content, combine it
    if (allContent.length > 0) {
      // Remove HTML/XML tags and entities
      const cleanedContent = allContent
        .map(item => item.replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' '))
        .filter(item => item.trim().length > 0)
        .join('\n');
      
      console.log(`Extracted ${cleanedContent.length} chars of structured content from presentation`);
      return cleanedContent;
    }
    
    // Fall back to simple text extraction if we couldn't find structured content
    console.log(`Falling back to simple text extraction for ${file.name}`);
    
    // Filter out binary garbage and extract meaningful text
    const lines = binText.split('\n')
      .map(line => line.trim())
      .filter(line => 
        line.length > 5 && 
        line.length < 200 &&
        !line.includes('\0') &&
        !/^[0-9A-F\s]+$/.test(line) && // Skip hex data
        line.split(/[a-zA-Z]/).length > 3 // Must have some letters
      );
    
    console.log(`Extracted ${lines.length} lines of text from presentation`);
    return lines.join('\n');
  } catch (error) {
    console.error(`Error extracting content from ${file.name}:`, error);
    return '';
  }
}

// Validate questions more stringently by looking for content phrases in the questions
const validateQuestionsAgainstContent = (questions, slideContent) => {
  console.log('Performing strict validation of questions against content...');
  
  // Create a more robust content index 
  // Break slide content into meaningful phrases
  const contentPhrases = slideContent
    .split(/[.!?;:]/)
    .map(phrase => phrase.trim())
    .filter(phrase => phrase.length > 15)
    .map(phrase => phrase.toLowerCase());
  
  // Create word index from slide content
  const contentWords = slideContent.toLowerCase()
    .replace(/[.,;:?!()"\[\]{}]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
  
  // Find frequently occurring words in the content (likely important terms)
  const importantWords = Object.keys(contentWords)
    .filter(word => contentWords[word] > 1)
    .filter(word => word.length > 3);
  
  console.log(`Found ${contentPhrases.length} content phrases and ${importantWords.length} important terms`);
  
  return questions.filter(question => {
    const questionText = (question.question + ' ' + question.options.join(' ')).toLowerCase();
    
    // Check if any significant word from the question appears in the content
    const words = questionText
      .replace(/[.,;:?!()"\[\]{}]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // 1. Calculate how many words in the question are important content words
    const importantWordMatches = words.filter(word => 
      importantWords.includes(word)
    ).length;
    
    // 2. Check if question contains reasonable number of any content words
    const contentWordMatches = words.filter(word => 
      contentWords[word]
    ).length;
    
    // 3. Check if the question appears to be related to any content phrase
    const phraseRelated = contentPhrases.some(phrase => {
      // A question is related to a phrase if they share several words
      const phraseWords = new Set(phrase.split(/\s+/).filter(w => w.length > 3));
      const questionWords = new Set(words);
      
      // Count the number of words they have in common
      const commonWords = [...phraseWords].filter(word => questionWords.has(word)).length;
      
      // If they share enough words, consider them related
      return commonWords >= 2;
    });
    
    // A question must satisfy at least one of these criteria to be valid:
    const isValid = (
      (importantWordMatches >= 2) || // 2+ important words from content
      (contentWordMatches >= 4) ||   // 4+ general content words 
      phraseRelated                  // Related to a specific content phrase
    );
    
    if (!isValid) {
      console.log(`Filtering out question not based on content: "${question.question}"`);
    }
    
    return isValid;
  });
};

// Function to generate questions strictly from keynote content
// Will never fall back to generic questions, only uses content from slides
async function generateStrictKeynoteQuestions(slideContent, questionCount) {
  console.log('EMERGENCY OVERRIDE: Using absolutely strict keynote-only question generation');
  
  // Create extremely simple content recognition questions as the safest option
  console.log('Creating direct content recognition questions ONLY from slide text');
  
  // Extract the most meaningful phrases from the content
  const contentPhrases = slideContent
    .split(/[.!?;\n]/)
    .map(line => line.trim())
    .filter(line => line.length > 15 && line.length < 200)
    .filter(line => !line.startsWith('http') && !line.includes('copyright') && !line.includes('©'));
  
  // Extract bullet points which are common in slides
  const bulletPoints = slideContent.match(/[•○◦▪▫■□→-]\s*[A-Za-z][^.!?\n]+/g) || [];
  
  // Extract slide titles
  const titles = slideContent.match(/(?:^|\n)(?:SLIDE|Slide|\d+\.|[A-Z][A-Z\s]{2,})[A-Za-z0-9\s:]{3,}(?:\:|$)/gm) || [];
  
  // Extract definitions which are common in educational slides
  const definitions = slideContent.match(/[A-Za-z\s]{2,20}:\s+[A-Za-z][^.!?\n]+/g) || [];
  
  // Combine all the extracted phrases
  let allPhrases = [...contentPhrases, ...bulletPoints, ...titles, ...definitions];
  
  // Remove duplicates
  allPhrases = [...new Set(allPhrases.map(p => p.trim()))];
  
  // Filter out empty or very short phrases
  allPhrases = allPhrases.filter(p => p.length > 15 && p.length < 200);
  
  console.log(`Found ${allPhrases.length} usable content phrases`);
  
  if (allPhrases.length < 3) {
    console.log('WARNING: Very few usable phrases found. Creating basic recognition questions.');
    return createEmergencyContentQuestions(slideContent, questionCount);
  }
  
  // Shuffle phrases for randomization
  const shuffledPhrases = allPhrases.sort(() => Math.random() - 0.5);
  
  // Take only the number of phrases we need (or fewer if not enough)
  const phrasesToUse = shuffledPhrases.slice(0, Math.min(questionCount * 2, shuffledPhrases.length));
  
  let questions = [];
  
  // Method 1: Direct content recognition questions (safest approach)
  // This creates questions that literally ask "Which statement appears in the slides?"
  const directQuestions = phrasesToUse.slice(0, questionCount).map((phrase, index) => {
    // Create a slightly modified version of the phrase for wrong answers
    const modifiedPhrase = phrase.replace(/is|are|the|a|an|will|can|should|would|has|have/g, match => {
      const replacements = {
        "is": "was", "are": "were", "the": "a", "a": "the", "an": "the",
        "will": "would", "can": "could", "should": "must", "would": "will",
        "has": "had", "have": "had"
      };
      return replacements[match] || match;
    });
    
    return {
      question: `Which statement appears in the presentation?`,
      options: [
        phrase, 
        modifiedPhrase,
        "Not mentioned in the slides", 
        "Different information in content"
      ],
      correctAnswer: 0
    };
  });
  
  questions = directQuestions;
  
  // If we have definitions, create "What is X?" questions
  const definitionPhrases = phrasesToUse.filter(p => p.includes(':'));
  if (definitionPhrases.length > 0) {
    const definitionQuestions = definitionPhrases.slice(0, Math.min(definitionPhrases.length, Math.floor(questionCount/2))).map(phrase => {
      const [term, definition] = phrase.split(':').map(p => p.trim());
      if (term && definition && term.length > 2 && definition.length > 5) {
        return {
          question: `What is ${term}?`,
          options: [
            definition, 
            "Not defined in the slides", 
            "Information not included", 
            "Different meaning in content"
          ],
          correctAnswer: 0
        };
      }
      return null;
    }).filter(q => q !== null);
    
    // Replace some direct questions with definition questions for variety
    if (definitionQuestions.length > 0) {
      questions = [
        ...questions.slice(0, questionCount - definitionQuestions.length),
        ...definitionQuestions
      ];
    }
  }
  
  // If we don't have enough questions, create some term recognition questions
  if (questions.length < questionCount) {
    // Extract important terms that appear multiple times
    const words = slideContent
      .toLowerCase()
      .replace(/[.,;:\(\)\[\]]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => /^[a-z]+$/i.test(word));
    
    // Count occurrences of each word
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Get important terms (appear multiple times)
    const importantTerms = Object.keys(wordCounts)
      .filter(word => wordCounts[word] > 1)
      .sort((a, b) => wordCounts[b] - wordCounts[a])
      .slice(0, (questionCount - questions.length) * 2);
    
    if (importantTerms.length > 0) {
      const termQuestions = importantTerms
        .slice(0, questionCount - questions.length)
        .map(term => {
          return {
            question: `Which term appears in the presentation?`,
            options: [
              term, 
              "Not found in the slides",
              "Term not present in content",
              "Different terminology used"
            ],
            correctAnswer: 0
          };
        });
      
      questions = [...questions, ...termQuestions];
    }
  }
  
  // Make sure we have exactly the requested number of questions
  questions = questions.slice(0, questionCount);
  
  console.log(`Created ${questions.length} strictly content-based questions`);
  
  return questions;
}

export async function POST(request) {
  try {
    console.log('Received request to generate questions');
    
    // Get form data from request
    const formData = await request.formData();
    
    // Extract room settings
    const roomName = formData.get('roomName');
    const isPrivate = formData.get('isPrivate') === 'true';
    const subject = formData.get('subject'); 
    const difficulty = formData.get('difficulty');
    const questionCount = parseInt(formData.get('questionCount') || '5');
    const userId = formData.get('userId');
    
    console.log(`Creating room: ${roomName}, Subject: ${subject}, Questions: ${questionCount}`);
    
    // Validate inputs
    if (!roomName) {
      return NextResponse.json(
        { success: false, error: 'Room name is required' },
        { status: 400 }
      );
    }
    
    // Get file uploads
    const files = formData.getAll('files');
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one file is required' },
        { status: 400 }
      );
    }
    
    // Generate questions without using OpenAI
    const questions = generateSubjectQuestions(subject, questionCount);
    console.log(`Generated ${questions.length} questions based on subject: ${subject}`);
    
    // Connect to database
    await connectToDatabase();
    
    // Initialize the Mongoose model
    const mongoose = await import('mongoose');
    if (mongoose.models.Room) {
      Room = mongoose.models.Room;
    } else {
      const RoomSchema = new mongoose.Schema({
        roomId: {
          type: String,
          required: true,
          unique: true,
        },
        roomName: {
          type: String,
          required: true,
        },
        questions: [
          {
            question: String,
            options: [String],
            correctAnswer: Number,
          }
        ],
        createdBy: String,
        isPrivate: {
          type: Boolean,
          default: false,
        },
        subject: String,
        difficulty: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        // Add users array for tracking team progress
        users: [{
          userId: String,
          username: String,
          joinedAt: {
            type: Date,
            default: Date.now
          },
          completedQuestions: [Number],
          score: {
            type: Number,
            default: 0
          },
          completed: {
            type: Boolean,
            default: false
          }
        }]
      });

      Room = mongoose.model('Room', RoomSchema);
    }
    
    // Create a unique room ID (URL-friendly)
    const roomId = randomUUID().replace(/-/g, '').substring(0, 10);
    
    // Save room to database
    const room = new Room({
      roomId,
      roomName,
      questions,
      isPrivate,
      subject,
      difficulty,
      createdBy: userId,
    });
    
    await room.save();
    console.log(`Room created with ID: ${roomId}, with ${questions.length} questions`);
    
    // Return success with room URL
    return NextResponse.json({
      success: true,
      roomId,
      roomName,
      questionCount: questions.length,
      redirectUrl: `/${roomId}`
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Function to generate questions based on subject
function generateSubjectQuestions(subject, count) {
  console.log(`Generating ${count} questions for subject: ${subject}`);
  
  const subjectLower = subject.toLowerCase();
  
  // Select the appropriate question set based on subject
  if (subjectLower.includes('biology') || subjectLower.includes('bio')) {
    return getBiologyQuestions(count);
  } else if (subjectLower.includes('physics') || subjectLower.includes('phys')) {
    return getPhysicsQuestions(count);
  } else if (subjectLower.includes('chemistry') || subjectLower.includes('chem')) {
    return getChemistryQuestions(count);
  } else if (subjectLower.includes('math') || subjectLower.includes('mathematics')) {
    return getMathQuestions(count);
  } else if (subjectLower.includes('computer') || subjectLower.includes('cs')) {
    return getComputerScienceQuestions(count);
  } else {
    // Default to biology if subject not recognized
    console.log(`Subject not recognized: ${subject}, defaulting to Biology`);
    return getBiologyQuestions(count);
  }
}

function getBiologyQuestions(count) {
  const questions = [
    {
      question: "Which organelle is responsible for producing energy in cells?",
      options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"],
      correctAnswer: 0
    },
    {
      question: "What is the primary function of DNA?",
      options: ["To store genetic information", "To produce energy", "To break down waste", "To transport nutrients"],
      correctAnswer: 0
    },
    {
      question: "Which process do plants use to make their own food?",
      options: ["Photosynthesis", "Respiration", "Digestion", "Fermentation"],
      correctAnswer: 0
    },
    {
      question: "What are the basic structural units of all living organisms?",
      options: ["Cells", "Atoms", "Tissues", "Organs"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a function of proteins in the body?",
      options: ["Energy storage", "Structural support", "Enzyme activity", "Immune response"],
      correctAnswer: 0
    },
    {
      question: "What is the process by which cells divide to produce two identical daughter cells?",
      options: ["Mitosis", "Meiosis", "Fertilization", "Mutation"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is the correct order of taxonomic classification from largest to smallest?",
      options: ["Kingdom, Phylum, Class, Order, Family, Genus, Species", "Species, Genus, Family, Order, Class, Phylum, Kingdom", "Domain, Kingdom, Order, Family, Genus, Species, Subspecies", "Phylum, Class, Order, Family, Kingdom, Genus, Species"],
      correctAnswer: 0
    },
    {
      question: "What is the main function of red blood cells?",
      options: ["To transport oxygen", "To fight infection", "To produce antibodies", "To clot blood"],
      correctAnswer: 0
    },
    {
      question: "Which of these is NOT a type of muscle tissue?",
      options: ["Epithelial muscle", "Cardiac muscle", "Skeletal muscle", "Smooth muscle"],
      correctAnswer: 0
    },
    {
      question: "What is the primary function of the lymphatic system?",
      options: ["To remove excess fluid and protect against infection", "To pump blood through the body", "To digest food and absorb nutrients", "To filter blood and remove wastes"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a component of a nucleotide?",
      options: ["Amino acid", "Phosphate group", "Nitrogenous base", "Sugar"],
      correctAnswer: 0
    },
    {
      question: "What is the role of enzymes in biological reactions?",
      options: ["To catalyze reactions", "To provide energy", "To transport molecules", "To store information"],
      correctAnswer: 0
    },
    {
      question: "Which organelle is responsible for protein synthesis?",
      options: ["Ribosomes", "Mitochondria", "Nucleus", "Lysosomes"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a stage of cellular respiration?",
      options: ["Photolysis", "Glycolysis", "Krebs cycle", "Electron transport chain"],
      correctAnswer: 0
    },
    {
      question: "Which structure in the human body is responsible for filtering blood?",
      options: ["Kidneys", "Lungs", "Liver", "Heart"],
      correctAnswer: 0
    }
  ];
  
  // Randomize the order of questions
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  // Return the requested number of questions
  return shuffledQuestions.slice(0, count);
}

function getPhysicsQuestions(count) {
  const questions = [
    {
      question: "What is the SI unit of force?",
      options: ["Newton", "Joule", "Watt", "Pascal"],
      correctAnswer: 0
    },
    {
      question: "Which law of motion states that for every action, there is an equal and opposite reaction?",
      options: ["Newton's Third Law", "Newton's First Law", "Newton's Second Law", "Law of Conservation of Energy"],
      correctAnswer: 0
    },
    {
      question: "What is the formula for calculating kinetic energy?",
      options: ["KE = (1/2)mv²", "KE = mgh", "KE = Fd", "KE = P/t"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a type of electromagnetic wave?",
      options: ["Sound waves", "Radio waves", "X-rays", "Ultraviolet waves"],
      correctAnswer: 0
    },
    {
      question: "What is the SI unit of electric current?",
      options: ["Ampere", "Volt", "Ohm", "Watt"],
      correctAnswer: 0
    },
    {
      question: "Which particle has a positive charge?",
      options: ["Proton", "Electron", "Neutron", "Photon"],
      correctAnswer: 0
    },
    {
      question: "What does Ohm's law relate?",
      options: ["Voltage, current, and resistance", "Force, mass, and acceleration", "Energy, power, and time", "Velocity, displacement, and time"],
      correctAnswer: 0
    },
    {
      question: "What is the speed of light in a vacuum?",
      options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10⁵ m/s", "3 × 10⁴ m/s"],
      correctAnswer: 0
    },
    {
      question: "Which lens type causes light rays to diverge?",
      options: ["Concave lens", "Convex lens", "Plano-convex lens", "Bifocal lens"],
      correctAnswer: 0
    },
    {
      question: "What is the law of conservation of energy?",
      options: ["Energy cannot be created or destroyed, only transformed", "Force equals mass times acceleration", "Every action has an equal and opposite reaction", "Objects in motion stay in motion unless acted upon by a force"],
      correctAnswer: 0
    }
  ];
  
  // Randomize the order of questions
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  // Return the requested number of questions
  return shuffledQuestions.slice(0, count);
}

function getChemistryQuestions(count) {
  const questions = [
    {
      question: "What is the atomic number of an element?",
      options: ["The number of protons", "The number of neutrons", "The number of electrons", "The sum of protons and neutrons"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a state of matter?",
      options: ["Energy", "Solid", "Liquid", "Gas"],
      correctAnswer: 0
    },
    {
      question: "What is the pH of a neutral solution?",
      options: ["7", "0", "14", "1"],
      correctAnswer: 0
    },
    {
      question: "Which type of bond involves the sharing of electrons?",
      options: ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"],
      correctAnswer: 0
    },
    {
      question: "What is the main component of natural gas?",
      options: ["Methane", "Propane", "Butane", "Ethane"],
      correctAnswer: 0
    },
    {
      question: "Which element has the chemical symbol 'Fe'?",
      options: ["Iron", "Fluorine", "Francium", "Fermium"],
      correctAnswer: 0
    },
    {
      question: "What is the process of splitting an atom called?",
      options: ["Nuclear fission", "Nuclear fusion", "Radioactive decay", "Ionization"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is a noble gas?",
      options: ["Argon", "Chlorine", "Nitrogen", "Oxygen"],
      correctAnswer: 0
    },
    {
      question: "What type of reaction releases heat?",
      options: ["Exothermic", "Endothermic", "Redox", "Neutralization"],
      correctAnswer: 0
    },
    {
      question: "What is the chemical formula for water?",
      options: ["H₂O", "CO₂", "NaCl", "O₂"],
      correctAnswer: 0
    }
  ];
  
  // Randomize the order of questions
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  // Return the requested number of questions
  return shuffledQuestions.slice(0, count);
}

function getMathQuestions(count) {
  const questions = [
    {
      question: "What is the value of π (pi) to two decimal places?",
      options: ["3.14", "3.16", "3.12", "3.18"],
      correctAnswer: 0
    },
    {
      question: "What is the formula for the area of a circle?",
      options: ["πr²", "2πr", "πr³", "4/3πr³"],
      correctAnswer: 0
    },
    {
      question: "What is the Pythagorean theorem?",
      options: ["a² + b² = c²", "E = mc²", "F = ma", "PV = nRT"],
      correctAnswer: 0
    },
    {
      question: "What is the derivative of x²?",
      options: ["2x", "x³", "2x²", "x"],
      correctAnswer: 0
    },
    {
      question: "What is the value of log₁₀(100)?",
      options: ["2", "10", "1", "100"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a prime number?",
      options: ["1", "2", "3", "5"],
      correctAnswer: 0
    },
    {
      question: "What is the formula for the volume of a sphere?",
      options: ["4/3πr³", "πr²", "2πr", "πr³"],
      correctAnswer: 0
    },
    {
      question: "What is the slope of a horizontal line?",
      options: ["0", "1", "Undefined", "Infinity"],
      correctAnswer: 0
    },
    {
      question: "What is the integral of 2x?",
      options: ["x² + C", "2x² + C", "x + C", "2 + C"],
      correctAnswer: 0
    },
    {
      question: "What is the quadratic formula?",
      options: ["x = (-b ± √(b² - 4ac)) / 2a", "E = mc²", "a² + b² = c²", "F = ma"],
      correctAnswer: 0
    }
  ];
  
  // Randomize the order of questions
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  // Return the requested number of questions
  return shuffledQuestions.slice(0, count);
}

function getComputerScienceQuestions(count) {
  const questions = [
    {
      question: "What does CPU stand for?",
      options: ["Central Processing Unit", "Computer Personal Unit", "Central Process Utility", "Central Processor Utility"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is a programming language?",
      options: ["Python", "Cobra", "Dolphin", "Tiger"],
      correctAnswer: 0
    },
    {
      question: "What does HTTP stand for?",
      options: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transit Protocol", "High Text Transfer Process"],
      correctAnswer: 0
    },
    {
      question: "What is the binary representation of the decimal number 10?",
      options: ["1010", "1000", "1100", "1110"],
      correctAnswer: 0
    },
    {
      question: "Which data structure operates on a Last-In-First-Out (LIFO) principle?",
      options: ["Stack", "Queue", "Array", "Tree"],
      correctAnswer: 0
    },
    {
      question: "What is the time complexity of binary search?",
      options: ["O(log n)", "O(n)", "O(n²)", "O(1)"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a web browser?",
      options: ["Photoshop", "Chrome", "Firefox", "Safari"],
      correctAnswer: 0
    },
    {
      question: "What does RAM stand for?",
      options: ["Random Access Memory", "Read Access Memory", "Random Access Module", "Read Access Module"],
      correctAnswer: 0
    },
    {
      question: "Which programming paradigm is based on the concept of 'objects' containing data and methods?",
      options: ["Object-Oriented Programming", "Functional Programming", "Procedural Programming", "Logic Programming"],
      correctAnswer: 0
    },
    {
      question: "What is the purpose of SQL?",
      options: ["To manage and query databases", "To design web pages", "To create mobile applications", "To program microcontrollers"],
      correctAnswer: 0
    }
  ];
  
  // Randomize the order of questions
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  // Return the requested number of questions
  return shuffledQuestions.slice(0, count);
} 