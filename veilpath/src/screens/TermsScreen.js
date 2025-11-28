/**
 * TERMS OF SERVICE SCREEN
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COSMIC } from '../components/VeilPathDesign';

const EFFECTIVE_DATE = 'November 26, 2025';

export default function TermsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>

        <Section title="1. Acceptance of Terms">
          By accessing or using VeilPath ("the App"), you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use the App.
        </Section>

        <Section title="2. Description of Service">
          VeilPath is a digital tarot reading and personal reflection application that provides:
          {'\n\n'}• Tarot card readings for entertainment and self-reflection
          {'\n'}• Personal journaling features
          {'\n'}• Progress tracking and achievements
          {'\n'}• Optional AI-powered interpretations (Premium feature)
          {'\n\n'}
          VeilPath is intended for entertainment and personal growth purposes only.
          It is not a substitute for professional advice, therapy, or medical treatment.
        </Section>

        <Section title="3. User Accounts">
          To use certain features, you must create an account. You agree to:
          {'\n\n'}• Provide accurate and complete information
          {'\n'}• Maintain the security of your password
          {'\n'}• Accept responsibility for all activities under your account
          {'\n'}• Notify us immediately of any unauthorized use
          {'\n\n'}
          You must be at least 13 years old to create an account.
          Users under 18 require parental consent.
        </Section>

        <Section title="4. Acceptable Use">
          You agree NOT to:
          {'\n\n'}• Use the App for any illegal purpose
          {'\n'}• Attempt to gain unauthorized access to our systems
          {'\n'}• Interfere with or disrupt the App's functionality
          {'\n'}• Upload malicious code or content
          {'\n'}• Harass, abuse, or harm other users
          {'\n'}• Use automated systems to access the App (bots, scrapers)
          {'\n'}• Resell or redistribute App content without permission
        </Section>

        <Section title="5. Intellectual Property">
          All content in VeilPath is the exclusive property of VeilPath and its licensors.
          This includes but is not limited to:
          {'\n\n'}• All tarot card artwork, illustrations, and visual designs
          {'\n'}• Card back designs, frames, and visual effects
          {'\n'}• User interface designs, layouts, and visual elements
          {'\n'}• All text content, card interpretations, and written materials
          {'\n'}• Software code, algorithms, and technical implementations
          {'\n'}• The "VeilPath" name, logo, and all associated branding
          {'\n'}• Audio, music, and sound effects
          {'\n'}• All AI-generated content and interpretations
          {'\n\n'}
          <Text style={{ fontWeight: '700', color: '#FFD700' }}>COPYRIGHT PROTECTION:</Text>
          {'\n'}All content is protected by copyright law and international treaties.
          Unauthorized reproduction, distribution, display, or creation of derivative works
          is strictly prohibited and may result in civil and criminal penalties.
          {'\n\n'}
          <Text style={{ fontWeight: '700', color: '#FFD700' }}>PROHIBITED USES:</Text>
          {'\n'}• Copying, screenshotting, or downloading card artwork for any purpose
          {'\n'}• Reproducing designs for personal or commercial use
          {'\n'}• Creating derivative works based on VeilPath content
          {'\n'}• Reverse engineering, decompiling, or extracting assets
          {'\n'}• Using any VeilPath content in other applications or media
          {'\n'}• Reselling, licensing, or distributing VeilPath content
          {'\n'}• Training AI/ML models on VeilPath content
          {'\n\n'}
          <Text style={{ fontWeight: '700', color: '#FFD700' }}>ENFORCEMENT:</Text>
          {'\n'}VeilPath actively monitors for unauthorized use of its intellectual property.
          Violations will be pursued to the fullest extent of the law, including DMCA
          takedown requests, civil litigation, and reporting to law enforcement where applicable.
          {'\n\n'}
          All rights not expressly granted are reserved by VeilPath.
        </Section>

        <Section title="6. User Content">
          You retain ownership of content you create (journal entries, notes).
          By using the App, you grant VeilPath a limited license to store and process
          your content solely to provide the service.
          {'\n\n'}
          We do not sell your personal journal content or share it with third parties.
        </Section>

        <Section title="7. Premium Subscriptions">
          VeilPath offers optional Premium subscriptions with additional features.
          {'\n\n'}• Subscriptions auto-renew unless cancelled
          {'\n'}• Prices may change with notice
          {'\n'}• Refunds are handled per app store policies (Apple/Google)
          {'\n'}• Cancellation takes effect at the end of the billing period
        </Section>

        <Section title="8. Disclaimers">
          THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
          {'\n\n'}
          • Tarot readings are for entertainment only
          {'\n'}• We do not guarantee accuracy of interpretations
          {'\n'}• AI features may produce unexpected or inaccurate results
          {'\n'}• We are not responsible for decisions made based on readings
          {'\n\n'}
          VeilPath is NOT a substitute for professional mental health services.
          If you are in crisis, please contact a mental health professional or
          crisis hotline.
        </Section>

        <Section title="9. Limitation of Liability">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, VEILPATH SHALL NOT BE LIABLE FOR:
          {'\n\n'}• Indirect, incidental, or consequential damages
          {'\n'}• Loss of data, profits, or business opportunities
          {'\n'}• Damages exceeding the amount paid for the service
          {'\n'}• Any harm resulting from reliance on tarot readings
        </Section>

        <Section title="10. Privacy">
          Your use of VeilPath is also governed by our Privacy Policy.
          Please review it to understand how we collect, use, and protect your data.
        </Section>

        <Section title="11. Termination">
          We may suspend or terminate your account if you violate these terms.
          You may delete your account at any time through the App settings.
          Upon termination, your right to use the App ceases immediately.
        </Section>

        <Section title="12. Changes to Terms">
          We may update these terms from time to time.
          We will notify you of material changes via the App or email.
          Continued use after changes constitutes acceptance of new terms.
        </Section>

        <Section title="13. Governing Law">
          These terms are governed by the laws of the United States.
          Disputes shall be resolved through binding arbitration,
          except where prohibited by law.
        </Section>

        <Section title="14. Contact">
          For questions about these Terms, contact us at:
          {'\n\n'}Email: legal@veilpath.app
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using VeilPath, you acknowledge that you have read and understood these Terms of Service.
          </Text>
          <Text style={styles.copyrightText}>
            © 2025 VeilPath. All Rights Reserved.
          </Text>
          <Text style={styles.lastUpdated}>
            Last Updated: November 2025
          </Text>
        </View>

        {navigation && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COSMIC.midnightVoid,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COSMIC.candleFlame,
    textAlign: 'center',
    marginBottom: 10,
  },
  effectiveDate: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COSMIC.deepAmethyst,
  },
  footerText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  copyrightText: {
    fontSize: 12,
    color: COSMIC.candleFlame,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 11,
    color: COSMIC.moonGlow,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  backButton: {
    marginTop: 30,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: COSMIC.deepAmethyst,
    borderRadius: 8,
  },
  backButtonText: {
    color: COSMIC.moonGlow,
    fontSize: 16,
    fontWeight: '600',
  },
});
