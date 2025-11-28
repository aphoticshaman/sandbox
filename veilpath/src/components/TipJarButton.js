/**
 * Tip Jar Button - VeilPath WitchTok x Victorian Gothic
 * Support the reader after a meaningful reading
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';

// Import VeilPath Design System
import {
  COSMIC,
  VictorianCard,
} from './VeilPathDesign';

export default function TipJarButton({ readingQuality = 'deep', visible = true }) {
  const [showModal, setShowModal] = useState(false);

  if (!visible) return null;

  // Tip amounts based on reading depth
  const suggestedAmounts = {
    quick: [1, 3, 5],
    standard: [3, 5, 10],
    deep: [5, 10, 20]
  };

  const amounts = suggestedAmounts[readingQuality] || suggestedAmounts.standard;

  const openPayment = (service, amount) => {
    const urls = {
      venmo: `venmo://paycharge?txn=pay&recipients=Ryan-Cardwell-15&amount=${amount}&note=Tarot Reading Tip`,
      cashapp: `https://cash.app/$ryancreating/${amount}`,
      paypal: `https://www.paypal.me/YourPayPalHandle/${amount}`
    };

    Linking.canOpenURL(urls[service])
      .then((supported) => {
        if (supported) {
          Linking.openURL(urls[service]);
        } else {
          const webUrls = {
            venmo: `https://venmo.com/u/Ryan-Cardwell-15?txn=pay&amount=${amount}`,
            cashapp: `https://cash.app/$ryancreating/${amount}`,
            paypal: urls.paypal
          };
          Linking.openURL(webUrls[service]);
        }
        setShowModal(false);
      })
      .catch(err => console.error('Payment link error:', err));
  };

  return (
    <View style={styles.container}>
      {/* Main CTA Button */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.mainButtonText}>
          Support Your Reader
        </Text>
        <Text style={styles.subtitle}>
          If this reading brought you clarity
        </Text>
      </TouchableOpacity>

      {/* Payment Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <VictorianCard style={styles.modalContent} glowColor={COSMIC.deepAmethyst}>
            <Text style={styles.modalIcon}>🔮</Text>
            <Text style={styles.modalTitle}>Your Reader Sees You</Text>

            <Text style={styles.modalText}>
              These readings take real energy.{'\n'}
              If the cards spoke truth,{'\n'}
              consider supporting the work.
            </Text>

            {/* Payment Options */}
            <View style={styles.paymentGrid}>
              {/* Venmo */}
              <View style={styles.serviceSection}>
                <Text style={styles.serviceName}>Venmo</Text>
                <View style={styles.amountRow}>
                  {amounts.map(amount => (
                    <TouchableOpacity
                      key={`venmo-${amount}`}
                      style={styles.amountButton}
                      onPress={() => openPayment('venmo', amount)}
                    >
                      <Text style={styles.amountText}>${amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* CashApp */}
              <View style={styles.serviceSection}>
                <Text style={styles.serviceName}>Cash App</Text>
                <View style={styles.amountRow}>
                  {amounts.map(amount => (
                    <TouchableOpacity
                      key={`cashapp-${amount}`}
                      style={styles.amountButton}
                      onPress={() => openPayment('cashapp', amount)}
                    >
                      <Text style={styles.amountText}>${amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* PayPal */}
              <View style={styles.serviceSection}>
                <Text style={styles.serviceName}>PayPal</Text>
                <View style={styles.amountRow}>
                  {amounts.map(amount => (
                    <TouchableOpacity
                      key={`paypal-${amount}`}
                      style={styles.amountButton}
                      onPress={() => openPayment('paypal', amount)}
                    >
                      <Text style={styles.amountText}>${amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeText}>Maybe Next Time</Text>
            </TouchableOpacity>
          </VictorianCard>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
  },
  mainButton: {
    borderWidth: 2,
    borderColor: COSMIC.candleFlame,
    borderRadius: 14,
    padding: 18,
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
    alignItems: 'center',
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  mainButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  subtitle: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 5, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    padding: 28,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  modalText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  paymentGrid: {
    width: '100%',
    gap: 20,
  },
  serviceSection: {
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  amountButton: {
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
  closeButton: {
    marginTop: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: COSMIC.crystalPink,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(248, 187, 208, 0.1)',
  },
  closeText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    fontWeight: '600',
  },
});
