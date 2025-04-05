import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import connectToDatabase from '@/lib/mongodb';
import { randomUUID } from 'crypto';

// Initialize Room model dynamically to avoid Next.js issues
let Room;

// Hugging Face API setup with hardcoded key to avoid environment variable issues
// In production, use proper environment variables management
const HF_API_KEY = "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";
const hf = new HfInference(HF_API_KEY);

// Function to extract text from various file types
async function extractTextFromFile(file) {
  const fileType = file.name.split('.').pop().toLowerCase();
  
  try {
    // Handle different file types
    switch (fileType) {
      case 'pdf':
        // For PDF files, use a simple approach that works reliably
        const pdfArrayBuffer = await file.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);
        
        console.log(`Processing PDF file: ${file.name}, size: ${Math.round(pdfArrayBuffer.byteLength / 1024)}KB`);
        
        let extractedText = '';
        
        try {
          // Try using pdf-parse
          const pdfParse = await import('pdf-parse').catch(() => null);
          
          if (pdfParse) {
            const data = await pdfParse.default(pdfBuffer);
            extractedText = data.text;
            console.log(`PDF parser extracted ${extractedText.length} characters from PDF`);
          }
        } catch (error) {
          console.error('Error using pdf-parse:', error);
          
          // Fallback: Basic text extraction from buffer
          extractedText = Buffer.from(pdfArrayBuffer).toString('utf8');
        }
        
        // Check if this is likely a slide presentation (based on text patterns)
        const isProbablySlides = 
          file.name.toLowerCase().includes('slide') || 
          file.name.toLowerCase().includes('presentation') ||
          extractedText.includes('Slide') ||
          (extractedText.match(/Slide\s+\d+/gi) || []).length > 2;
        
        if (isProbablySlides) {
          console.log('PDF appears to be slides or presentation, using specialized cleaning');
          return cleanSlideContent(extractedText);
        }
        
        // Clean extracted text - remove XML/XMP metadata, UUID identifiers, and non-content tags
        const cleanedText = extractedText
          // Remove XML tags
          .replace(/<[^>]*>|<\/[^>]*>/g, ' ')
          // Remove XMP metadata
          .replace(/xmp\.did:[a-zA-Z0-9]+/g, ' ')
          // Remove UUIDs and identifiers
          .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, ' ')
          .replace(/id="[^"]*"/g, ' ')
          // Remove formatting codes
          .replace(/\\[a-z0-9]+/g, ' ')
          // Remove URLs
          .replace(/(https?:\/\/[^\s]+)/g, ' ')
          // Remove odd characters
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
          // Normalize whitespace
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log(`Cleaned PDF text length: ${cleanedText.length} characters`);
        
        // If after cleaning, text is too short, try alternative extraction
        if (cleanedText.length < 200) {
          console.log('Cleaned text too short, using fallback extraction');
          
          // Very simple content-grabbing heuristic: look for larger text blocks
          const chunks = extractedText.split(/\s{2,}/).filter(chunk => chunk.length > 100);
          if (chunks.length > 0) {
            console.log(`Found ${chunks.length} text chunks longer than 100 chars`);
            return chunks.join(' ');
          }
        }
        
        return cleanedText;
        
      case 'pptx':
      case 'key':
      case 'keynote':
      case 'ppt':
        // For presentation files
        const presentationBuffer = await file.arrayBuffer();
        
        console.log(`Processing presentation file: ${file.name}, size: ${Math.round(presentationBuffer.byteLength / 1024)}KB`);
        
        // Basic text extraction
        let presentationText = Buffer.from(presentationBuffer).toString('utf8');
        
        // Use specialized cleaning for slides
        return cleanSlideContent(presentationText);
        
      case 'txt':
      case 'md':
      case 'html':
      case 'htm':
      case 'js':
      case 'ts':
      case 'json':
      case 'css':
      default:
        // Text-based files
        const textContent = await file.text();
        console.log(`Extracted ${textContent.length} characters from text file: ${file.name}`);
        return textContent;
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return '';
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
  const bulletPointsPattern = /(?:[-•●○◦▪▫■□✓✔✕✖★☆♦♣♠♥→←↑↓…]|\*|\(\d+\)|\d+\)|\d+\.|\[\d+\])\s+[^\n\r;.]{5,}/g;
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
async function generateQuestionsWithFallback(text, subject, difficulty, count = 5) {
  try {
    console.log(`Generating ${count} questions strictly from provided content`);
    
    // Pre-process the text to find the most meaningful content
    // Better content extraction - focus on actual educational content
    const contentLines = text
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => 
        line.length > 15 && 
        !line.includes('http') && 
        !line.includes('<') &&
        !line.includes('xmlns') &&
        !line.match(/^[0-9\.]+$/) // Skip lines that are just numbers
      );
    
    // Join the meaningful content
    const cleanedContent = contentLines.join('\n');
    console.log(`Cleaned content for prompt: ${cleanedContent.length} characters`);
    
    if (cleanedContent.length < 200) {
      console.warn('Not enough clean content found, using fallback questions');
      return getSubjectSpecificQuestions(subject, count);
    }
    
    // Create a much more focused prompt that strictly uses only the provided content
    const strictPrompt = `You are an educational quiz creator with the task of creating multiple-choice questions EXCLUSIVELY FROM THE PROVIDED TEXT CONTENT BELOW. 
    
IMPORTANT RULES:
1. ONLY create questions about information EXPLICITLY stated in the text
2. DO NOT use any outside knowledge or make up facts not present in the text
3. Create exactly ${count} questions
4. Each question must have exactly 4 options with only one correct answer
5. The correct answer must always be at index 0
6. The wrong options must be plausible but clearly incorrect based on the text

TEXT CONTENT:
${cleanedContent.slice(0, 6000)}

FORMAT REQUIREMENTS:
- Return ONLY a valid JSON array of question objects
- Each question must follow this format:
{
  "question": "Question text based on the content?",
  "options": ["Correct answer", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
  "correctAnswer": 0
}

NO EXPLANATIONS OR ADDITIONAL TEXT - JUST THE JSON ARRAY OF QUESTIONS.`;

    console.log('Using strict content-focused prompt');
    
    // Try with the strict prompt and lower temperature for more focused questions
    try {
      const result = await hf.textGeneration({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        inputs: strictPrompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.2, // Lower temperature for much more focused output
          top_p: 0.7
        }
      });
      
      // Use a more robust regex to extract the JSON
      const jsonMatch = result.generated_text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        try {
          const questions = JSON.parse(jsonMatch[0]);
          console.log(`Successfully parsed ${questions.length} questions from strict prompt`);
          
          if (questions.length > 0) {
            // More robust validation
            const validQuestions = questions.filter(q => 
              q.question && 
              q.question.length > 15 &&
              !q.question.includes('http') &&
              !q.question.includes('<') &&
              Array.isArray(q.options) && 
              q.options.length === 4 &&
              q.options.every(opt => typeof opt === 'string' && opt.length > 0) &&
              typeof q.correctAnswer === 'number' &&
              q.correctAnswer === 0 // We instructed correctAnswer to always be 0
            );
            
            if (validQuestions.length >= count) {
              return validQuestions.slice(0, count);
            }
            
            if (validQuestions.length > 0) {
              // If we have some valid questions but not enough, use what we have
              console.log(`Only found ${validQuestions.length} valid questions, returning those`);
              return validQuestions;
            }
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
        }
      }
    } catch (error) {
      console.error('Error with strict prompt:', error);
    }
    
    // If the strict approach failed, try with a simpler but still content-focused prompt
    console.log('Strict prompt failed, trying simpler content-focused prompt');
    
    // Extract key bullet points or important sentences for the simpler prompt
    const contentChunks = cleanedContent
      .split(/\n/)
      .filter(line => line.length > 30)
      .slice(0, 15)
      .join('\n\n');
    
    const simplerPrompt = `Create ${count} multiple-choice questions ONLY using this content:

${contentChunks}

Rules:
- Questions must be based ONLY on facts from the text above
- Each question must have 4 options with exactly one correct answer
- The correct answer must be the first option (index 0)
- Format as a JSON array:

[
  {
    "question": "Question directly from the content?",
    "options": ["Correct answer", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
    "correctAnswer": 0
  }
]`;

    try {
      const secondResult = await hf.textGeneration({
        model: "mistralai/Mistral-7B-Instruct-v0.2", 
        inputs: simplerPrompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.1, // Even lower temperature
          top_p: 0.9
        }
      });
      
      const secondJsonMatch = secondResult.generated_text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (secondJsonMatch) {
        try {
          const questions = JSON.parse(secondJsonMatch[0]);
          console.log(`Second approach parsed ${questions.length} questions`);
          
          if (questions.length > 0) {
            return questions.slice(0, count);
          }
        } catch (parseError) {
          console.error('Error parsing JSON from second attempt:', parseError);
        }
      }
    } catch (error) {
      console.error('Error in second attempt:', error);
    }
    
    // Last resort - try with just key sections of the text
    console.log('Both attempts failed, trying with key text sections');
    
    // Find the most likely content sections - look for clusters of text
    const textSections = cleanedContent
      .split(/\n\s*\n/)
      .filter(section => section.length > 100)
      .slice(0, 3)
      .join('\n\n');
    
    if (textSections.length > 200) {
      const thirdPrompt = `Create ${count} multiple-choice quiz questions about the following content:

${textSections}

Requirements:
- Only include facts mentioned in the text
- Format as JSON array with "question", "options", and "correctAnswer" fields
- Each question has 4 options
- Correct answer is at index 0
- No explanations, only JSON`;

      try {
        const thirdResult = await hf.textGeneration({
          model: "mistralai/Mistral-7B-Instruct-v0.2",
          inputs: thirdPrompt,
          parameters: {
            max_new_tokens: 1200,
            temperature: 0.1
          }
        });
        
        const thirdJsonMatch = thirdResult.generated_text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        
        if (thirdJsonMatch) {
          try {
            const questions = JSON.parse(thirdJsonMatch[0]);
            console.log(`Third approach parsed ${questions.length} questions`);
            
            if (questions.length > 0) {
              return questions.slice(0, count);
            }
          } catch (error) {
            console.error('Error parsing third attempt:', error);
          }
        }
      } catch (error) {
        console.error('Error in third attempt:', error);
      }
    }
    
    // If all attempts failed, fall back to subject-specific questions
    console.log('All content-based attempts failed, using fallback questions');
    return getSubjectSpecificQuestions(subject, count);
  } catch (error) {
    console.error('Error in question generation:', error);
    return getSubjectSpecificQuestions(subject, count);
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
    
    // Classify files
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const slideFiles = files.filter(f => 
      ['ppt', 'pptx', 'key', 'keynote'].some(ext => f.name.toLowerCase().endsWith(`.${ext}`))
    );
    const textFiles = files.filter(f => 
      ['txt', 'md', 'doc', 'docx'].some(ext => f.name.toLowerCase().endsWith(`.${ext}`))
    );
    const otherFiles = files.filter(f => 
      !pdfFiles.includes(f) && !slideFiles.includes(f) && !textFiles.includes(f)
    );
    
    console.log(`File breakdown: ${pdfFiles.length} PDFs, ${slideFiles.length} slides, ${textFiles.length} text, ${otherFiles.length} other`);
    
    // Extract text from all files
    let allText = '';
    let slideContent = '';
    let textQualityScore = 0;
    
    // Process files in priority order
    const filesToProcess = [...slideFiles, ...pdfFiles, ...textFiles, ...otherFiles];
    
    for (const file of filesToProcess) {
      console.log(`Processing file: ${file.name}`);
      const text = await extractTextFromFile(file);
      
      // Check if this is a slide file or slide-formatted PDF
      const isSlideContent = 
        slideFiles.includes(file) || 
        (pdfFiles.includes(file) && 
         (file.name.toLowerCase().includes('slide') || 
          file.name.toLowerCase().includes('presentation')));
      
      // Simple text quality check
      const hasRealText = Boolean(
        text && 
        text.length > 100 && 
        !text.includes('<xmp:') &&
        text.split(/\s+/).length > 30 &&
        text.split(/[,.!?;:]/).length > 5
      );
      
      if (hasRealText) {
        textQualityScore++;
        
        if (isSlideContent) {
          slideContent += text + '\n\n';
        } else {
          allText += text + '\n\n';
        }
      } else {
        console.warn(`Low quality text extracted from ${file.name}, might be metadata or binary content`);
      }
    }
    
    // Combine content, prioritizing slide content
    const combinedText = (slideContent || '') + '\n\n' + (allText || '');
    
    console.log(`Extracted total of ${combinedText.length} characters of text from ${files.length} files`);
    console.log(`Text quality score: ${textQualityScore}/${files.length}`);
    
    let questions;
    
    // If we have reasonable quality text, try to generate questions from it
    if (textQualityScore > 0 && combinedText.length > 300) {
      console.log('Text quality sufficient for content-based question generation');
      questions = await generateQuestionsWithFallback(combinedText, subject, difficulty, questionCount);
    } else {
      // If text extraction failed, use subject-specific questions
      console.log('Text quality insufficient, using subject-specific questions');
      questions = getSubjectSpecificQuestions(subject, questionCount);
    }
    
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
        }
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