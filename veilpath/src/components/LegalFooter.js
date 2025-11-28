/**
 * LEGAL FOOTER
 * Small ToS/Privacy links for bottom of navigation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COSMIC } from './VeilPathDesign';

export function LegalFooter() {
  const navigation = useNavigation();

  const handleTerms = () => {
    navigation.navigate('Terms');
  };

  const handlePrivacy = () => {
    navigation.navigate('Privacy');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleTerms}>
        <Text style={styles.link}>Terms of Service</Text>
      </TouchableOpacity>
      <Text style={styles.separator}>•</Text>
      <TouchableOpacity onPress={handlePrivacy}>
        <Text style={styles.link}>Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(10, 5, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 20, 140, 0.3)',
    gap: 10,
  },
  link: {
    fontSize: 10,
    color: 'rgba(138, 180, 248, 0.7)',
    textDecorationLine: 'underline',
  },
  separator: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

export default LegalFooter;
