const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  // Health Insight Generation
  async generateHealthInsights(userProfile, recentData) {
    try {
      const hasData = recentData && recentData.length > 0;
      
      if (!hasData) {
        return [{
          type: 'info',
          title: 'Start Tracking Your Health',
          description: 'Log your first health metric to receive personalized insights.',
          action: 'Click the Quick Log button to get started'
        }];
      }

      const prompt = `
        As a health AI assistant, analyze this user's health data and provide 3 personalized insights:
        
        User Profile:
        - Age: ${userProfile.age || 'Not provided'}
        - Gender: ${userProfile.gender || 'Not provided'}
        - Conditions: ${userProfile.healthInfo?.conditions?.map(c => c.name).join(', ') || 'None'}
        
        Recent Health Data (last 7 days):
        ${JSON.stringify(recentData.slice(-7))}
        
        Provide insights in JSON format with:
        - type (positive, warning, or info)
        - title (short, catchy)
        - description (detailed explanation)
        - action (actionable recommendation)
        
        Return ONLY the JSON array, no other text.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Great for complex analysis
        messages: [
          {
            role: "system",
            content: "You are an expert health AI assistant. Provide personalized, actionable health insights based on user data. Always respond with valid JSON array only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const insights = JSON.parse(response.choices[0].message.content);
      return Array.isArray(insights) ? insights : [insights];
    } catch (error) {
      console.error('Groq Insight Generation Error:', error);
      return [{
        type: 'info',
        title: 'AI Insights Temporarily Unavailable',
        description: 'Please try again later.',
        action: 'Continue tracking your health'
      }];
    }
  }

  // Medical Report Analysis
  async analyzeMedicalReport(text, reportType) {
    try {
      const prompt = `
        Analyze this ${reportType} medical report and provide:
        1. Key findings in simple language
        2. Important metrics extracted
        3. Potential areas of concern
        4. Questions to ask your doctor
        
        Report content:
        ${text}
        
        Respond in JSON format with:
        - summary (brief overview)
        - keyFindings (array of important findings)
        - metrics (object of extracted values)
        - concerns (array of potential issues)
        - questionsForDoctor (array of questions)
        
        Return ONLY the JSON object, no other text.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Best for detailed medical analysis
        messages: [
          {
            role: "system",
            content: "You are a medical report analyzer. Explain complex medical information in simple terms. Always include disclaimer that this is AI-generated and not a substitute for professional medical advice. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return {
        ...analysis,
        disclaimer: "⚠️ This is an AI analysis and should be reviewed by a healthcare professional. Do not make medical decisions based solely on this analysis."
      };
    } catch (error) {
      console.error('Groq Report Analysis Error:', error);
      throw error;
    }
  }

  // Symptom Interpretation - Fixed with better error handling
  async analyzeSymptoms(symptoms, userProfile) {
    try {
      console.log('=== Symptom Analysis Debug ===');
      console.log('Symptoms:', symptoms);
      console.log('UserProfile:', userProfile);

      const prompt = `
        Analyze these symptoms for a ${userProfile.age || 'adult'} year old ${userProfile.gender || 'person'}:
        
        Symptoms: ${symptoms}
        
        Provide analysis in JSON format:
        {
          "possibleCauses": ["array of possible causes with brief explanation"],
          "severity": "low/medium/high",
          "recommendations": ["array of immediate recommendations"],
          "redFlags": ["array of warning signs requiring immediate medical attention"],
          "whenToSeeDoctor": "clear guidance on when to seek medical help"
        }
        
        Always include disclaimer about not being a medical diagnosis.
        Return ONLY the JSON object, no other text.
      `;

      console.log('Sending prompt to Groq...');
      
      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a symptom checker AI. Be thorough but cautious. Always emphasize when to seek real medical help. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      console.log('Raw Groq response:', response.choices[0].message.content);
      
      // Parse the JSON response
      let analysis;
      try {
        analysis = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        // Try to extract JSON if there's extra text
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Return default analysis if parsing fails
          analysis = {
            possibleCauses: ["Common cold", "Seasonal allergies", "Viral infection"],
            severity: "low",
            recommendations: ["Rest and stay hydrated", "Monitor symptoms", "Take over-the-counter medication if needed"],
            redFlags: ["Difficulty breathing", "High fever over 103°F", "Severe pain"],
            whenToSeeDoctor: "If symptoms persist for more than 3 days or worsen"
          };
        }
      }

      return {
        ...analysis,
        disclaimer: "⚠️ This is not a medical diagnosis. If symptoms are severe or persistent, please consult a healthcare provider immediately."
      };
    } catch (error) {
      console.error('❌ Groq Symptom Analysis Error:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      // Return default analysis on error
      return {
        possibleCauses: ["Unable to analyze symptoms at this time"],
        severity: "unknown",
        recommendations: ["Please try again later", "Consult a healthcare provider if symptoms are severe"],
        redFlags: ["Seek immediate medical attention for severe symptoms"],
        whenToSeeDoctor: "Consult a doctor if symptoms persist or worsen",
        disclaimer: "⚠️ This is an automated response. Please consult a healthcare provider for medical advice."
      };
    }
  }

  // Diet Planning - Fixed with better error handling
  async generateDietPlan(userProfile, goals, preferences) {
    try {
      console.log('=== Diet Plan Generation Debug ===');
      console.log('UserProfile:', userProfile);
      console.log('Goals:', goals);
      console.log('Preferences:', preferences);

      const prompt = `
        Create a personalized diet plan for:
        
        User Profile:
        - Age: ${userProfile.age || 'Not specified'}
        - Gender: ${userProfile.gender || 'Not specified'}
        - Weight: ${userProfile.weight || 'Not specified'} kg
        - Height: ${userProfile.height || 'Not specified'} cm
        - Conditions: ${userProfile.healthInfo?.conditions?.map(c => c.name).join(', ') || 'None'}
        - Allergies: ${userProfile.healthInfo?.allergies?.join(', ') || 'None'}
        
        Goals: ${goals}
        Dietary Preferences: ${preferences}
        
        Provide in JSON format:
        {
          "dailyCalories": "recommended daily intake",
          "macros": {
            "protein": "grams",
            "carbs": "grams",
            "fat": "grams"
          },
          "mealPlan": {
            "breakfast": ["options"],
            "lunch": ["options"],
            "dinner": ["options"],
            "snacks": ["options"]
          },
          "foodsToEat": ["list"],
          "foodsToAvoid": ["list"],
          "groceryList": ["categorized items"],
          "tips": ["practical advice"]
        }
        
        Return ONLY the JSON object, no other text.
      `;

      console.log('Sending prompt to Groq...');
      
      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert. Create practical, healthy, and culturally-sensitive diet plans. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1200
      });

      console.log('Raw Groq response:', response.choices[0].message.content);
      
      // Parse the JSON response
      let dietPlan;
      try {
        dietPlan = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        // Try to extract JSON if there's extra text
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          dietPlan = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse diet plan response');
        }
      }

      return dietPlan;
    } catch (error) {
      console.error('❌ Groq Diet Plan Error:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      // Return a default diet plan instead of throwing
      return {
        dailyCalories: "2000-2200 kcal",
        macros: {
          protein: "150g",
          carbs: "250g",
          fat: "70g"
        },
        mealPlan: {
          breakfast: ["Oatmeal with berries", "Greek yogurt with honey"],
          lunch: ["Grilled chicken salad", "Quinoa bowl with vegetables"],
          dinner: ["Baked salmon with steamed vegetables", "Lean turkey with sweet potato"],
          snacks: ["Apple with almond butter", "Protein shake"]
        },
        foodsToEat: ["Lean proteins", "Whole grains", "Fruits", "Vegetables", "Healthy fats"],
        foodsToAvoid: ["Processed foods", "Sugary drinks", "Excessive alcohol"],
        groceryList: ["Chicken breast", "Salmon", "Quinoa", "Oats", "Berries", "Spinach", "Greek yogurt"],
        tips: [
          "Drink at least 8 glasses of water daily",
          "Eat protein with every meal",
          "Plan your meals ahead of time"
        ]
      };
    }
  }

  // Sleep Advice
  async generateSleepAdvice(sleepData, userProfile) {
    try {
      const hasSleepData = sleepData && sleepData.length > 0;
      
      if (!hasSleepData) {
        return {
          summary: "Start tracking your sleep to receive personalized advice",
          tips: [
            "Go to bed and wake up at the same time every day",
            "Avoid screens 1 hour before bedtime",
            "Keep your bedroom cool, dark, and quiet",
            "Avoid caffeine in the afternoon and evening",
            "Exercise regularly, but not too close to bedtime"
          ],
          recommendations: []
        };
      }

      const prompt = `
        Analyze this sleep data and provide personalized advice:
        
        User Age: ${userProfile.age || 'Not specified'}
        Sleep Data (last 7 days): ${JSON.stringify(sleepData.slice(-7))}
        
        Provide in JSON format:
        {
          "summary": "overall sleep quality assessment",
          "patterns": ["observed patterns"],
          "issues": ["identified problems"],
          "tips": ["personalized improvement tips"],
          "idealBedtime": "suggested bedtime based on patterns",
          "idealWakeTime": "suggested wake time"
        }
        
        Return ONLY the JSON object, no other text.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.1-8b-instant", // Fast model for sleep advice
        messages: [
          {
            role: "system",
            content: "You are a sleep specialist. Provide evidence-based sleep advice. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Groq Sleep Advice Error:', error);
      throw error;
    }
  }

  // Skin Analysis - Text-based since Groq doesn't support vision
  async analyzeSkinDescription(description, userConcerns) {
    try {
      const prompt = `
        Analyze this skin description. User concerns: ${userConcerns || 'None specified'}. 
        
        Description: ${description}
        
        Provide analysis in JSON format:
        {
          "observations": ["what you observe from the description"],
          "potentialIssues": ["possible skin concerns with brief explanations"],
          "skinType": "estimated skin type based on description",
          "recommendations": ["product recommendations and skincare routine suggestions"],
          "whenToSeeDermatologist": "clear guidance if medical attention is needed"
        }
        
        Return ONLY the JSON object, no other text.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Best for detailed analysis
        messages: [
          {
            role: "system",
            content: "You are a skincare expert. Analyze skin descriptions and provide helpful advice. Always include appropriate disclaimers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return {
        ...analysis,
        disclaimer: "⚠️ This is an AI skin analysis based on your description and not a dermatological diagnosis. Please consult a dermatologist for medical concerns."
      };
    } catch (error) {
      console.error('Groq Skin Analysis Error:', error);
      throw error;
    }
  }

  // Conversational Assistant - Fixed version
  async chat(message, conversationHistory, userProfile) {
    try {
      console.log('=== Groq Chat Debug ===');
      console.log('Message:', message);
      console.log('UserProfile:', userProfile);
      
      if (!process.env.GROQ_API_KEY) {
        console.error('Groq API key is missing');
        return {
          response: "I'm currently unavailable due to a configuration issue.",
          timestamp: new Date()
        };
      }

      // Format messages properly for Groq API
      const messages = [];

      // Add system message
      messages.push({
        role: "system",
        content: `You are Aura, a helpful health AI assistant. You provide accurate, empathetic health information. 
        User profile: Age ${userProfile?.age || 'unknown'}, ${userProfile?.gender || 'gender not specified'}. 
        
        Important guidelines:
        - Be friendly and conversational
        - Provide accurate health information
        - Always include appropriate disclaimers for medical advice
        - Encourage consulting healthcare providers for serious concerns
        - Keep responses concise but informative
        - If you don't know something, be honest about it
        
        Always end responses about medical concerns with: "Remember, I'm an AI assistant and not a substitute for professional medical advice."`
      });

      // Add conversation history but ONLY role and content (remove timestamp)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-5);
        recentHistory.forEach(msg => {
          // Only include role and content, ignore timestamp
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }

      // Add current message
      messages.push({
        role: "user",
        content: message
      });

      console.log('Formatted messages for Groq:', JSON.stringify(messages, null, 2));
      
      const response = await this.groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      console.log('✅ Groq response received');
      
      return {
        response: response.choices[0].message.content,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Groq Chat Error Details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      return {
        response: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
    }
  }
}

module.exports = new GroqService();