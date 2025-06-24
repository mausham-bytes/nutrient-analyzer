from flask import Flask, request, jsonify, send_from_directory
import os
import base64
import requests
import json
from werkzeug.utils import secure_filename
from PIL import Image
import io
import traceback

app = Flask(__name__)

# Add CORS headers manually
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# API Configuration - get from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', 'your-openai-api-key')
NUTRITIONIX_APP_ID = os.getenv('NUTRITIONIX_APP_ID', 'your-nutritionix-app-id')
NUTRITIONIX_API_KEY = os.getenv('NUTRITIONIX_API_KEY', 'your-nutritionix-api-key')

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_image(image_path, max_size=(800, 800), quality=85):
    """Resize image to reduce file size while maintaining quality."""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Resize image if it's too large
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            optimized_path = image_path.replace('.', '_optimized.')
            img.save(optimized_path, 'JPEG', quality=quality, optimize=True)
            
            return optimized_path
    except Exception as e:
        print(f"Error resizing image: {e}")
        return image_path

def encode_image_to_base64(image_path):
    """Encode image to base64 string."""
    try:
        with open(image_path, 'rb') as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

def analyze_food_with_openai(image_base64):
    """Analyze food image using OpenAI Vision API."""
    try:
        # Check if we have a real OpenAI API key (starts with sk-)
        if not OPENAI_API_KEY.startswith('sk-'):
            print("OpenAI API key required for vision analysis. Using fallback data.")
            fallback = get_nutritional_data_fallback()
            fallback['analysis_notes'] = "Demo mode: Please configure OpenAI API key for actual food analysis"
            return fallback
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENAI_API_KEY}'
        }
        
        payload = {
            'model': 'gpt-4-vision-preview',
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'text',
                            'text': '''Analyze this food image and provide detailed nutritional information. 
                            Please identify all food items visible and provide nutritional data for each item.
                            
                            Return the response in the following JSON format:
                            {
                                "foods": [
                                    {
                                        "name": "Food Item Name",
                                        "calories": 250,
                                        "protein": 15,
                                        "carbs": 30,
                                        "fat": 8,
                                        "fiber": 5,
                                        "sugar": 12,
                                        "serving_size": "1 cup",
                                        "confidence": 0.85
                                    }
                                ],
                                "summary": {
                                    "totalCalories": 500,
                                    "totalProtein": 25,
                                    "totalCarbs": 60,
                                    "totalFat": 15,
                                    "totalFiber": 8,
                                    "totalSugar": 20
                                },
                                "analysis_notes": "Brief description of what was identified"
                            }
                            
                            Please be as accurate as possible with the nutritional values and include confidence scores.'''
                        },
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': f'data:image/jpeg;base64,{image_base64}'
                            }
                        }
                    ]
                }
            ],
            'max_tokens': 1500
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # Try to parse the JSON response
            try:
                # Find JSON content in the response
                start_idx = content.find('{')
                end_idx = content.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx]
                    return json.loads(json_str)
                else:
                    raise ValueError("No JSON found in response")
            except json.JSONDecodeError:
                # If JSON parsing fails, create a basic response
                return create_fallback_response(content)
        else:
            error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
            
    except Exception as e:
        print(f"Error in OpenAI analysis: {e}")
        raise e

def create_fallback_response(analysis_text):
    """Create a fallback response when JSON parsing fails."""
    return {
        "foods": [
            {
                "name": "Food Item",
                "calories": 300,
                "protein": 12,
                "carbs": 35,
                "fat": 10,
                "fiber": 4,
                "sugar": 8,
                "serving_size": "1 serving",
                "confidence": 0.5
            }
        ],
        "summary": {
            "totalCalories": 300,
            "totalProtein": 12,
            "totalCarbs": 35,
            "totalFat": 10,
            "totalFiber": 4,
            "totalSugar": 8
        },
        "analysis_notes": f"Analysis completed. Raw response: {analysis_text[:200]}..."
    }

def get_nutritional_data_fallback():
    """Provide fallback nutritional data when APIs are unavailable."""
    return {
        "foods": [
            {
                "name": "Mixed Food Item",
                "calories": 250,
                "protein": 10,
                "carbs": 30,
                "fat": 8,
                "fiber": 3,
                "sugar": 15,
                "serving_size": "1 serving",
                "confidence": 0.3
            }
        ],
        "summary": {
            "totalCalories": 250,
            "totalProtein": 10,
            "totalCarbs": 30,
            "totalFat": 8,
            "totalFiber": 3,
            "totalSugar": 15
        },
        "analysis_notes": "Using fallback nutritional data. Please configure API keys for accurate analysis."
    }

@app.route('/')
def index():
    """Serve the main application page."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files."""
    return send_from_directory('.', filename)

@app.route('/analyze', methods=['POST'])
def analyze_food():
    """Analyze uploaded food image."""
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload a PNG, JPG, JPEG, or WebP image.'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = str(int(os.path.getmtime(__file__) * 1000))
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Resize and optimize image
            optimized_path = resize_image(file_path)
            
            # Encode image to base64
            image_base64 = encode_image_to_base64(optimized_path)
            
            if not image_base64:
                raise Exception("Failed to encode image")
            
            # Analyze with OpenAI (if API key is configured)
            if OPENAI_API_KEY and OPENAI_API_KEY != 'your-openai-api-key':
                try:
                    analysis_result = analyze_food_with_openai(image_base64)
                except Exception as api_error:
                    print(f"OpenAI API failed: {api_error}")
                    # Fall back to basic response
                    analysis_result = get_nutritional_data_fallback()
                    analysis_result['analysis_notes'] = f"API Error: {str(api_error)[:100]}..."
            else:
                # Use fallback when no API key is configured
                analysis_result = get_nutritional_data_fallback()
            
            # Clean up temporary files
            try:
                os.remove(file_path)
                if optimized_path != file_path:
                    os.remove(optimized_path)
            except:
                pass
            
            return jsonify(analysis_result)
            
        except Exception as processing_error:
            # Clean up file on error
            try:
                os.remove(file_path)
            except:
                pass
            
            error_msg = f"Error processing image: {str(processing_error)}"
            print(error_msg)
            print(traceback.format_exc())
            
            return jsonify({
                'error': error_msg,
                'details': str(processing_error)
            }), 500
            
    except Exception as e:
        error_msg = f"Server error: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        
        return jsonify({
            'error': error_msg,
            'details': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'message': 'CalorieTracker API is running',
        'api_configured': {
            'openai': OPENAI_API_KEY != 'your-openai-api-key',
            'nutritionix': NUTRITIONIX_API_KEY != 'your-nutritionix-api-key'
        }
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting CalorieTracker API...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"OpenAI API configured: {OPENAI_API_KEY != 'your-openai-api-key'}")
    print(f"Nutritionix API configured: {NUTRITIONIX_API_KEY != 'your-nutritionix-api-key'}")
    print("Server running on http://0.0.0.0:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
