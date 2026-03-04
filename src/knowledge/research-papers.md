# Research Publications

## Paper 1: Depression Detection Using CNN and LSTM
**Published during undergrad at Vidyalankar Institute of Technology**

A hybrid LSTM-CNN deep learning model that detects depression from social media text by analyzing Reddit posts. Achieved 93.41% accuracy — outperforming SVM (91%), DNN (83.6%), and Naive Bayes (83%) baselines.

**My contributions:** Designed the complete hybrid architecture (Embedding → Conv1D → MaxPooling → LSTM → Dropout → Dense → Sigmoid), curated and preprocessed 7,731 Reddit posts, configured training with Adam optimizer and early stopping.

**Results:** F1: 0.93, AUC: 0.93, Accuracy: 93.41%

**Tech:** Python, TensorFlow/Keras, NLTK, NLP preprocessing, CNN + LSTM

---

## Paper 2: Decoding Mental Health — ML for Social Media Analysis
A Mental Health Score (MHS) system that quantifies a user's well-being based on social media behavior — screen time, sleep patterns, content consumption — using semi-supervised learning.

**My contributions:** Co-designed system architecture, implemented three semi-supervised algorithms for dynamic feature weighting, designed the MHS formula (weighted average of 7 behavioral features), built threshold-based intervention system (MHS > 50 = healthy, MHS < 50 = counselor recommendation).

**Tech:** Python, Semi-Supervised Learning, MCDM Weighted Average

---

## Paper 3: PAWnnect — IoT-ML Driven Pet Monitoring
An end-to-end IoT + ML platform for real-time dog health monitoring. GPS-enabled smart collar streams health data to a mobile app. InceptionV3 transfer learning model classifies dog skin diseases.

**My contributions:** Co-designed full system architecture, built and trained InceptionV3 skin disease classifier (4 classes), implemented threshold-based health alerting (fever, obesity), contributed to mobile app UI.

**Results:** All 4 test cases passed. Successfully classified 4 dog skin disease categories in real-time.

**Tech:** Python, TensorFlow/Keras, InceptionV3, Arduino UNO, GPS/GSM modules, REST API, Android
