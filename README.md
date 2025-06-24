# Nutrient Analyzer

## AI-Powered Food Analysis for Health and Wellness

Welcome to the Nutrient Analyzer project! This innovative web application leverages artificial intelligence to provide instant nutritional insights from food images. Designed for health enthusiasts, dietitians, and anyone curious about their food intake, this tool simplifies the process of tracking calories and macronutrients by transforming complex data into an easily digestible format. Our goal is to empower users with accurate, real-time information about their meals, fostering a deeper understanding of dietary habits and promoting healthier lifestyle choices.




## Features

The Nutrient Analyzer is packed with features designed to make nutritional tracking effortless and insightful:

*   **Image-Based Analysis**: Simply upload or capture a photo of your meal, and our advanced AI model will process the image to identify food items and estimate their nutritional content. This eliminates the need for manual data entry, making the process quick and convenient.
*   **Comprehensive Nutritional Breakdown**: Get detailed information on calories, proteins, carbohydrates, and fats for your analyzed meals. This breakdown helps you understand the macronutrient composition of your diet at a glance.
*   **Historical Data Tracking**: The application keeps a record of your previous analyses, allowing you to review your dietary patterns over time. This feature is invaluable for monitoring progress, identifying trends, and making informed adjustments to your eating habits.
*   **User-Friendly Interface**: With a clean and intuitive design, the Nutrient Analyzer is easy to navigate, ensuring a smooth and enjoyable user experience for everyone, regardless of their technical proficiency.




## How to Run

To get the Nutrient Analyzer up and running on your local machine, follow these simple steps:

### Prerequisites

Ensure you have Python 3.x installed on your system. You can download it from the official Python website.

### Installation

1.  **Clone the repository (if you haven't already):**

    ```bash
    git clone https://github.com/mausham-bytes/nutrient-analyzer.git
    cd nutrient-analyzer
    ```

2.  **Install the required Python packages:**

    It is highly recommended to use a virtual environment to manage dependencies.

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    pip install -r requirements_list.txt
    ```

### Running the Application

Once the dependencies are installed, you can start the Flask application:

```bash
python app.py
```

The application will typically run on `http://127.0.0.1:5000/`. Open your web browser and navigate to this address to access the Nutrient Analyzer.




## Project Structure

The project is organized into several key files and directories, each serving a specific purpose:

*   `app.py`: The main Flask application file, handling routing, AI model integration, and data processing.
*   `index.html`: The primary HTML file for the web interface, providing the user with the image upload and display functionalities.
*   `style.css`: Contains the cascading style sheets for the application, defining the visual presentation and layout.
*   `script.js`: Houses the JavaScript code for client-side interactions, such as image preview and dynamic content updates.
*   `requirements_list.txt`: Lists all the Python dependencies required for the project, ensuring a smooth setup process.
*   `LICENSE`: Specifies the licensing terms under which the project is distributed.
*   `.gitignore`: Configures Git to ignore specified files and directories, keeping the repository clean.
*   `pyproject.toml`: Project metadata and build system configuration.
*   `uv.lock`: Lock file for `uv` package manager, ensuring reproducible builds.
*   `run_app.py`: An alternative entry point or utility script for running the application.




## Contributing

We welcome contributions to the Nutrient Analyzer project! If you have suggestions for improvements, new features, or bug fixes, please feel free to:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes** and ensure they are well-documented and tested.
4.  **Submit a pull request** with a clear description of your changes.

Your contributions help make this project better for everyone!



