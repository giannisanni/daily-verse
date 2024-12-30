from flask import Flask, render_template
import requests
import json
from datetime import datetime
import sys
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Get Ollama connection details from environment variables
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'host.docker.internal')
OLLAMA_PORT = os.getenv('OLLAMA_PORT', '11434')
OLLAMA_URL = f'http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/generate'

def get_daily_verse():
    prompt = """You are a spiritual guide. Your task is to provide a Bible verse response in this EXACT format, with no additional text before or after:

Bible Verse:
"[verse text]"
- [book chapter:verse]

Interpretation:
[1-2 sentences of uplifting interpretation focusing on personal growth and encouragement]

Prayer/Affirmation:
[1-2 sentences of prayer or affirmation based on the verse. Always end with 'in Jesus name, Amen']

Example response:
Bible Verse:
"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."
- Joshua 1:9

Interpretation:
God promises to be with us in every situation, giving us the strength to face any challenge. This verse reminds us that fear and discouragement don't have to control our lives.

Prayer/Affirmation:
Lord, I choose to be strong and courageous today, knowing that you are always with me. Help me to face my challenges with confidence, trusting in your presence and power, in Jesus name, Amen."""

    print("Connecting to Ollama...")
    try:
        response = requests.post(OLLAMA_URL,
                               json={
                                   "model": "llama3.1",
                                   "prompt": prompt,
                                   "stream": False
                               },
                               timeout=30)  # Add 30 second timeout
        
        print("Response received from Ollama...")
        if response.status_code == 200:
            result = response.json()
            response_text = result['response']
            
            print("\n=== DEBUG START ===")
            print("Raw response from Ollama:", repr(response_text))  # Use repr to show exact string including whitespace
            print("Response length:", len(response_text))
            print("First 50 characters:", repr(response_text[:50]))
            print("Character codes of first 20 chars:", [ord(c) for c in response_text[:20]])
            
            # Clean up the response
            response_text = response_text.strip()
            
            print("\nCleaned response:", repr(response_text))
            print("Cleaned length:", len(response_text))
            print("First 50 characters of cleaned:", repr(response_text[:50]))
            
            # Validate response format
            required_sections = ["Bible Verse:", "Interpretation:", "Prayer/Affirmation:"]
            missing_sections = [section for section in required_sections if section not in response_text]
            
            if missing_sections:
                print(f"Error: Missing sections: {missing_sections}")
                return f"Error: Invalid response format - missing sections: {', '.join(missing_sections)}"
            
            # Ensure sections are in correct order
            lines = response_text.split('\n')
            section_indices = {section: next((i for i, line in enumerate(lines) if section in line), -1) 
                             for section in required_sections}
            
            if not all(section_indices[required_sections[i]] < section_indices[required_sections[i+1]] 
                      for i in range(len(required_sections)-1)):
                print("Error: Sections are not in correct order")
                return "Error: Invalid response format - sections in wrong order"
            
            print("=== DEBUG END ===\n")
                
            return response_text
        else:
            print(f"Error response: {response.text}")
            return f"Error: Unable to get response. Status code: {response.status_code}"
            
    except requests.exceptions.Timeout:
        return "Error: Request to Ollama timed out after 30 seconds"
    except requests.exceptions.ConnectionError:
        return "Error: Could not connect to Ollama. Make sure Ollama is running (ollama serve)"
    except requests.exceptions.RequestException as e:
        return f"Error connecting to Ollama: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_verse', methods=['GET'])
def verse():
    print("\n=== GET /get_verse called ===")
    try:
        verse_message = get_daily_verse()
        print(f"Verse message: {verse_message}")  # Debug logging
        response = {'verse': verse_message}
        print("Returning response:", response)
        return response
    except Exception as e:
        error_response = {'error': str(e)}
        print("Error occurred:", error_response)
        return error_response, 500

def main():
    app.run(host='0.0.0.0', port=80, debug=True)

if __name__ == "__main__":
    main()
