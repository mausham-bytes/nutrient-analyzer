class CalorieTracker {
    constructor() {
        this.currentImage = null;
        this.analysisHistory = this.loadHistory();
        this.currentAnalysis = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadHistoryView();
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.cameraInput = document.getElementById('cameraInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        
        // Preview elements
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImage = document.getElementById('previewImage');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.removeBtn = document.getElementById('removeBtn');
        
        // Loading elements
        this.loadingSection = document.getElementById('loadingSection');
        this.loadingText = document.getElementById('loadingText');
        this.loadingSubtext = document.getElementById('loadingSubtext');
        this.progressFill = document.getElementById('progressFill');
        
        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.foodCards = document.getElementById('foodCards');
        this.summaryCard = document.getElementById('summaryCard');
        this.newAnalysisBtn = document.getElementById('newAnalysisBtn');
        this.viewHistoryBtn = document.getElementById('viewHistoryBtn');
        
        // History elements
        this.historySection = document.getElementById('historySection');
        this.historyGrid = document.getElementById('historyGrid');
        this.backToUploadBtn = document.getElementById('backToUploadBtn');
        
        // Error elements
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorDetails = document.getElementById('errorDetails');
        this.errorDetailsText = document.getElementById('errorDetailsText');
        this.retryBtn = document.getElementById('retryBtn');
        this.showDetailsBtn = document.getElementById('showDetailsBtn');
        
        // Sections
        this.uploadSection = document.querySelector('.upload-section');
    }

    setupEventListeners() {
        // Upload area drag and drop
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        
        // File inputs
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.cameraInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Buttons
        this.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        this.cameraBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cameraInput.click();
        });
        this.analyzeBtn.addEventListener('click', this.analyzeImage.bind(this));
        this.removeBtn.addEventListener('click', this.removeImage.bind(this));
        this.retryBtn.addEventListener('click', this.retryAnalysis.bind(this));
        this.newAnalysisBtn.addEventListener('click', this.startNewAnalysis.bind(this));
        this.viewHistoryBtn.addEventListener('click', this.showHistory.bind(this));
        this.backToUploadBtn.addEventListener('click', this.startNewAnalysis.bind(this));
        this.showDetailsBtn.addEventListener('click', this.toggleErrorDetails.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!this.validateFile(file)) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = {
                file: file,
                dataUrl: e.target.result,
                name: file.name,
                size: file.size
            };
            this.showImagePreview();
        };
        reader.readAsDataURL(file);
    }

    validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            this.showError('Please select a valid image file (JPEG, PNG, or WebP).');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('Image file is too large. Please select an image smaller than 10MB.');
            return false;
        }

        return true;
    }

    showImagePreview() {
        this.previewImage.src = this.currentImage.dataUrl;
        this.imagePreview.style.display = 'block';
        this.imagePreview.classList.add('fade-in');
    }

    removeImage() {
        this.currentImage = null;
        this.imagePreview.style.display = 'none';
        this.fileInput.value = '';
        this.cameraInput.value = '';
    }

    async analyzeImage() {
        if (!this.currentImage) {
            this.showError('Please select an image first.');
            return;
        }

        try {
            this.showLoading();
            this.retryCount = 0;
            
            const analysis = await this.performAnalysis();
            this.currentAnalysis = analysis;
            this.saveToHistory(analysis);
            this.showResults(analysis);
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError('Failed to analyze the image. Please check your connection and try again.', error);
        }
    }

    async performAnalysis() {
        const formData = new FormData();
        formData.append('image', this.currentImage.file);

        // Update loading progress
        this.updateProgress(10, 'Uploading image...');

        // Use the Flask server URL directly
        const apiUrl = window.location.port === '5500' ? 'http://localhost:5000/analyze' : '/analyze';
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        this.updateProgress(50, 'Processing image...');

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        this.updateProgress(80, 'Analyzing nutrition...');

        const result = await response.json();
        
        this.updateProgress(100, 'Analysis complete!');

        // Add image data to result
        result.image = this.currentImage.dataUrl;
        result.imageName = this.currentImage.name;
        result.timestamp = new Date().toISOString();

        return result;
    }

    async retryAnalysis() {
        if (this.retryCount >= this.maxRetries) {
            this.showError('Maximum retry attempts reached. Please try with a different image or check your connection.');
            return;
        }

        this.retryCount++;
        
        try {
            this.showLoading();
            this.updateProgress(0, `Retrying analysis (${this.retryCount}/${this.maxRetries})...`);
            
            const analysis = await this.performAnalysis();
            this.currentAnalysis = analysis;
            this.saveToHistory(analysis);
            this.showResults(analysis);
            
        } catch (error) {
            console.error(`Retry ${this.retryCount} failed:`, error);
            
            if (this.retryCount < this.maxRetries) {
                this.showError(`Analysis failed. Retrying... (${this.retryCount}/${this.maxRetries})`, error);
                // Auto-retry after 2 seconds
                setTimeout(() => this.retryAnalysis(), 2000);
            } else {
                this.showError('Analysis failed after multiple attempts. Please try with a different image.', error);
            }
        }
    }

    showLoading() {
        this.hideAllSections();
        this.loadingSection.style.display = 'block';
        this.loadingSection.classList.add('fade-in');
        this.updateProgress(0, 'Preparing analysis...');
    }

    updateProgress(percentage, text, subtext = 'Please wait while we process your image') {
        this.progressFill.style.width = `${percentage}%`;
        this.loadingText.textContent = text;
        this.loadingSubtext.textContent = subtext;
    }

    showResults(analysis) {
        this.hideAllSections();
        this.resultsSection.style.display = 'block';
        this.resultsSection.classList.add('fade-in');
        
        this.renderFoodCards(analysis.foods || []);
        this.renderSummary(analysis.summary || {});
    }

    renderFoodCards(foods) {
        this.foodCards.innerHTML = '';
        
        foods.forEach(food => {
            const card = document.createElement('div');
            card.className = 'food-card';
            
            card.innerHTML = `
                <h3>${food.name}</h3>
                <div class="nutrition-info">
                    <div class="nutrition-item">
                        <span class="nutrition-value">${food.calories || 0}</span>
                        <span class="nutrition-label">Calories</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-value">${food.protein || 0}g</span>
                        <span class="nutrition-label">Protein</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-value">${food.carbs || 0}g</span>
                        <span class="nutrition-label">Carbs</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-value">${food.fat || 0}g</span>
                        <span class="nutrition-label">Fat</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-value">${food.fiber || 0}g</span>
                        <span class="nutrition-label">Fiber</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-value">${food.sugar || 0}g</span>
                        <span class="nutrition-label">Sugar</span>
                    </div>
                </div>
            `;
            
            this.foodCards.appendChild(card);
        });
    }

    renderSummary(summary) {
        this.summaryCard.innerHTML = `
            <h3>Total Nutritional Information</h3>
            <div class="total-nutrition">
                <div class="total-item">
                    <span class="total-value">${summary.totalCalories || 0}</span>
                    <span class="total-label">Total Calories</span>
                </div>
                <div class="total-item">
                    <span class="total-value">${summary.totalProtein || 0}g</span>
                    <span class="total-label">Total Protein</span>
                </div>
                <div class="total-item">
                    <span class="total-value">${summary.totalCarbs || 0}g</span>
                    <span class="total-label">Total Carbs</span>
                </div>
                <div class="total-item">
                    <span class="total-value">${summary.totalFat || 0}g</span>
                    <span class="total-label">Total Fat</span>
                </div>
            </div>
        `;
    }

    showHistory() {
        this.hideAllSections();
        this.historySection.style.display = 'block';
        this.historySection.classList.add('fade-in');
        this.loadHistoryView();
    }

    loadHistoryView() {
        this.historyGrid.innerHTML = '';
        
        if (this.analysisHistory.length === 0) {
            this.historyGrid.innerHTML = `
                <div class="history-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-history" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3 style="color: #666;">No Analysis History</h3>
                    <p style="color: #999;">Start analyzing some food images to see your history here!</p>
                </div>
            `;
            return;
        }

        this.analysisHistory.reverse().forEach((analysis, index) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.addEventListener('click', () => this.showHistoryResult(analysis));
            
            const date = new Date(analysis.timestamp).toLocaleDateString();
            const time = new Date(analysis.timestamp).toLocaleTimeString();
            
            card.innerHTML = `
                <img src="${analysis.image}" alt="${analysis.imageName}">
                <div class="history-info">
                    <h4>${analysis.imageName}</h4>
                    <div class="history-date">${date} at ${time}</div>
                    <div class="history-summary">
                        <span>${analysis.foods?.length || 0} items</span>
                        <span>${analysis.summary?.totalCalories || 0} cal</span>
                    </div>
                </div>
            `;
            
            this.historyGrid.appendChild(card);
        });
    }

    showHistoryResult(analysis) {
        this.currentAnalysis = analysis;
        this.showResults(analysis);
    }

    saveToHistory(analysis) {
        this.analysisHistory.push(analysis);
        this.saveHistory();
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('calorie_tracker_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('calorie_tracker_history', JSON.stringify(this.analysisHistory));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    showError(message, error = null) {
        this.hideAllSections();
        this.errorSection.style.display = 'block';
        this.errorSection.classList.add('fade-in');
        
        this.errorMessage.textContent = message;
        
        if (error) {
            this.errorDetailsText.textContent = `${error.message}\n\nStack trace:\n${error.stack}`;
            this.showDetailsBtn.style.display = 'inline-flex';
        } else {
            this.showDetailsBtn.style.display = 'none';
        }
        
        this.errorDetails.style.display = 'none';
    }

    toggleErrorDetails() {
        const isVisible = this.errorDetails.style.display !== 'none';
        this.errorDetails.style.display = isVisible ? 'none' : 'block';
        this.showDetailsBtn.innerHTML = isVisible 
            ? '<i class="fas fa-info-circle"></i> Show Details'
            : '<i class="fas fa-eye-slash"></i> Hide Details';
    }

    startNewAnalysis() {
        this.hideAllSections();
        this.uploadSection.style.display = 'block';
        this.uploadSection.classList.add('fade-in');
        this.removeImage();
        this.currentAnalysis = null;
        this.retryCount = 0;
    }

    hideAllSections() {
        const sections = [
            this.uploadSection,
            this.loadingSection,
            this.resultsSection,
            this.historySection,
            this.errorSection
        ];
        
        sections.forEach(section => {
            if (section) {
                section.style.display = 'none';
                section.classList.remove('fade-in');
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CalorieTracker();
});
