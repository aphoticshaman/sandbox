/**
 * MCQ Modal - VeilPath WitchTok x Victorian Gothic
 * Multiple choice questions during card readings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';

// Import VeilPath Design System
import {
  COSMIC,
  VictorianCard,
} from './VeilPathDesign';

/**
 * Get human-readable label for question type
 */
function getQuestionTypeLabel(type) {
  const labels = {
    resonance: 'Resonance Check',
    aspect: 'What Stands Out',
    emotion: 'Emotional Response',
    confirmation: 'Card Relationship',
    situation: 'Life Context',
    action: 'Action Readiness',
    takeaway: 'Pattern Recognition',
    readiness: 'Next Steps',
  };
  return labels[type] || 'Question';
}

const MCQModal = ({
  visible,
  questions,
  cardName,
  cardNumber,
  totalCards,
  onComplete,
  onSkip,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const currentQuestion = questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions?.length - 1;
  const progress = ((currentQuestionIndex + 1) / (questions?.length || 1)) * 100;

  const handleAnswer = (optionIndex) => {
    const newAnswers = [
      ...answers,
      {
        questionType: currentQuestion.type,
        question: currentQuestion.question,
        selectedOption: currentQuestion.options[optionIndex],
        selectedOptionIndex: optionIndex,
      },
    ];

    setAnswers(newAnswers);

    if (isLastQuestion) {
      onComplete(newAnswers);
      resetModal();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const handleSkip = () => {
    onSkip();
    resetModal();
  };

  const resetModal = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  if (!visible || !currentQuestion) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleSkip}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.cardContext}>
                Card {cardNumber} of {totalCards}: {cardName}
              </Text>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>Skip All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>

          {/* Question Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <VictorianCard style={styles.questionCard}>
              <Text style={styles.questionType}>
                {getQuestionTypeLabel(currentQuestion.type)}
              </Text>
              <Text style={styles.questionText}>
                {currentQuestion.question}
              </Text>

              {currentQuestion.subtext && (
                <Text style={styles.questionSubtext}>
                  {currentQuestion.subtext}
                </Text>
              )}
            </VictorianCard>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswer(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionContent}>
                    {currentQuestion.type === 'resonance' && (
                      <View style={styles.scaleIndicator}>
                        <Text style={styles.scaleNumber}>{index + 1}</Text>
                      </View>
                    )}
                    <Text style={styles.optionText}>
                      {option.text || option}
                    </Text>
                  </View>
                  {option.description && (
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {currentQuestionIndex > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>← Previous Question</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer hint */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLastQuestion
                ? 'Last question for this card'
                : `${questions.length - currentQuestionIndex - 1} more question${
                    questions.length - currentQuestionIndex - 1 === 1 ? '' : 's'
                  }`}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COSMIC.midnightVoid,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 18,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.3)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardContext: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  skipButtonText: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    color: COSMIC.crystalPink,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COSMIC.candleFlame,
    borderRadius: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionCard: {
    marginBottom: 24,
    padding: 22,
  },
  questionType: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    fontWeight: '600',
    color: COSMIC.candleFlame,
  },
  questionText: {
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '600',
    marginBottom: 10,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  questionSubtext: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    color: COSMIC.crystalPink,
    opacity: 0.9,
  },
  optionsContainer: {
    gap: 14,
  },
  optionButton: {
    backgroundColor: 'rgba(74, 20, 140, 0.15)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scaleIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COSMIC.candleFlame,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f3a',
  },
  optionText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    color: COSMIC.moonGlow,
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
    fontStyle: 'italic',
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  backButton: {
    marginTop: 24,
    padding: 14,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.3)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
});

export default MCQModal;
