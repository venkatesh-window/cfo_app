import pandas as pd
import numpy as np
import re
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix

def clean_text(text):
    """
    Step 1: Data Cleaning
    Cleans the input text by:
    - Converting to lowercase
    - Removing special characters
    - Removing extra spaces
    """
    if pd.isna(text):
        return ""
    
    # Convert to lowercase
    text = str(text).lower()
    
    # Remove special characters (keep only letters and spaces)
    # The prompt explicitly showed "Bought Rice!!!" -> "bought rice"
    text = re.sub(r'[^a-z\s]', '', text)
    
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def main():
    print("🚀 Starting Pocket CFO ML Training Pipeline...\n")

    # Step 1: Load dataset
    print("📂 Step 1: Loading dataset (transactions.csv)...")
    try:
        df = pd.read_csv("transactions.csv")
        print(f"✅ Loaded {len(df)} transactions.\n")
    except FileNotFoundError:
        print("❌ Error: transactions.csv not found! Please ensure it's in the same directory.")
        return

    # Step 2: Clean text
    print("🧹 Step 2: Cleaning text data...")
    df['clean_text'] = df['text'].apply(clean_text)
    print("✅ Text cleaning complete.\n")

    # Prepare features and target
    X = df['clean_text']
    y = df['category']

    # Step 4: Split data (80% training / 20% testing)
    print("📊 Step 3: Splitting data into training (80%) and testing (20%)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print("✅ Split complete.\n")

    # Step 2 (Feature Extraction): Convert text to numeric vectors using TF-IDF
    print("🔢 Step 4: Extracting features using TfidfVectorizer...")
    vectorizer = TfidfVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    print("✅ Feature extraction complete.\n")

    # Step 3: Train Model (Logistic Regression)
    print("🧠 Step 5: Training Logistic Regression classifier...")
    classifier = LogisticRegression(random_state=42)
    classifier.fit(X_train_vec, y_train)
    print("✅ Model training complete.\n")

    # Step 5: Evaluate Model
    print("📈 Step 6: Evaluating model accuracy...")
    y_pred = classifier.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    # Show accuracy
    print(f"🎯 Accuracy: {accuracy:.2f}")
    
    # Show confusion matrix
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\n✅ Evaluation complete.\n")

    # Step 6: Save Model
    print("💾 Step 7: Saving the trained model and vectorizer...")
    with open('classifier.pkl', 'wb') as f:
        pickle.dump(classifier, f)
    
    with open('vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    print("✅ Saved 'classifier.pkl' and 'vectorizer.pkl'.\n")

    # Step 7: Test Prediction
    print("🧪 Step 8: Testing some custom predictions...")
    test_inputs = [
        "Rice 500",
        "Rent paid",
        "Sold milk",
        "Petrol",
        "milk 40",
        "rice 200",
        "rent 3000",
        "Bought milk for 40",
        "Paid shop rent",
        "Sold vegetables"
    ]

    for text in test_inputs:
        # Clean the input text, just like training data
        cleaned = clean_text(text)
        # Convert text into its vector form
        vec = vectorizer.transform([cleaned])
        # Predict the category
        prediction = classifier.predict(vec)[0]
        print(f"   {text} \u2192 {prediction}")

    print("\n🎉 ML Training Pipeline completed successfully!")

if __name__ == "__main__":
    main()
