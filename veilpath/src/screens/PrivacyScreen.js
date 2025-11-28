/**
 * PRIVACY POLICY SCREEN
 * GDPR, CCPA, and international privacy law compliant
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { COSMIC } from '../components/VeilPathDesign';

const EFFECTIVE_DATE = 'November 26, 2025';
const CONTACT_EMAIL = 'privacy@veilpath.app';

export default function PrivacyScreen({ navigation }) {
  const openLink = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>

        <Text style={styles.intro}>
          VeilPath ("we," "our," or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you use our mobile application and website.
        </Text>

        {/* Section 1 */}
        <Section title="1. Information We Collect">
          <SubSection title="Information You Provide">
            • <Bold>Account Information:</Bold> Email address, password (encrypted), display name
            {'\n'}• <Bold>Profile Data:</Bold> Zodiac sign, birthdate (optional)
            {'\n'}• <Bold>User Content:</Bold> Journal entries, reading notes, intentions
            {'\n'}• <Bold>Payment Information:</Bold> Processed securely by Apple/Google; we do not store card details
          </SubSection>

          <SubSection title="Information Collected Automatically">
            • <Bold>Usage Data:</Bold> Features used, reading frequency, session duration
            {'\n'}• <Bold>Device Information:</Bold> Device type, operating system, app version
            {'\n'}• <Bold>Analytics Data:</Bold> Aggregated usage patterns (via PostHog)
            {'\n'}• <Bold>Crash Reports:</Bold> Technical information when errors occur
          </SubSection>

          <SubSection title="Information We Do NOT Collect">
            • Your precise location
            {'\n'}• Contacts or phone data
            {'\n'}• Social media accounts
            {'\n'}• Biometric data
          </SubSection>
        </Section>

        {/* Section 2 */}
        <Section title="2. How We Use Your Information">
          <Text style={styles.sectionText}>We use collected information to:</Text>
          {'\n\n'}• Provide and maintain the VeilPath service
          {'\n'}• Personalize your tarot reading experience
          {'\n'}• Process subscriptions and payments
          {'\n'}• Send service-related communications
          {'\n'}• Improve app performance and features
          {'\n'}• Detect and prevent fraud or abuse
          {'\n'}• Comply with legal obligations
          {'\n\n'}
          <Bold>We do NOT:</Bold>
          {'\n'}• Sell your personal data to third parties
          {'\n'}• Use your data for targeted advertising
          {'\n'}• Share your journal entries with anyone
          {'\n'}• Train AI models on your personal content
        </Section>

        {/* Section 3 */}
        <Section title="3. Data Sharing and Disclosure">
          We may share your information only with:
          {'\n\n'}
          <Bold>Service Providers</Bold>
          {'\n'}• <Bold>Supabase:</Bold> Database and authentication (US-based)
          {'\n'}• <Bold>PostHog:</Bold> Privacy-focused analytics (EU-based option available)
          {'\n'}• <Bold>Anthropic:</Bold> AI interpretations - Premium feature only, no personal data stored
          {'\n'}• <Bold>RevenueCat:</Bold> Subscription management
          {'\n\n'}
          <Bold>Legal Requirements</Bold>
          {'\n'}We may disclose data if required by law, court order, or to protect rights and safety.
          {'\n\n'}
          <Bold>Business Transfers</Bold>
          {'\n'}In the event of a merger or acquisition, your data may be transferred with notice provided.
        </Section>

        {/* Section 4 */}
        <Section title="4. Data Retention">
          • <Bold>Account Data:</Bold> Retained while your account is active
          {'\n'}• <Bold>Journal Entries:</Bold> Retained until you delete them or your account
          {'\n'}• <Bold>Analytics Data:</Bold> Aggregated and anonymized after 90 days
          {'\n'}• <Bold>Deleted Accounts:</Bold> Data permanently removed within 30 days
          {'\n\n'}
          You can export your data or request deletion at any time.
        </Section>

        {/* Section 5 */}
        <Section title="5. Data Security">
          We implement industry-standard security measures:
          {'\n\n'}• Passwords hashed with bcrypt + salt
          {'\n'}• All data encrypted in transit (TLS/HTTPS)
          {'\n'}• Database encryption at rest
          {'\n'}• Row-level security policies
          {'\n'}• Regular security audits
          {'\n'}• Limited employee access to user data
          {'\n\n'}
          While we strive to protect your data, no system is 100% secure.
        </Section>

        {/* GDPR Section */}
        <Section title="6. Your Rights (GDPR - European Union)">
          If you are in the EU/EEA, you have the right to:
          {'\n\n'}• <Bold>Access:</Bold> Request a copy of your personal data
          {'\n'}• <Bold>Rectification:</Bold> Correct inaccurate data
          {'\n'}• <Bold>Erasure:</Bold> Request deletion of your data ("Right to be Forgotten")
          {'\n'}• <Bold>Portability:</Bold> Export your data in a machine-readable format
          {'\n'}• <Bold>Restriction:</Bold> Limit how we process your data
          {'\n'}• <Bold>Object:</Bold> Object to processing based on legitimate interests
          {'\n'}• <Bold>Withdraw Consent:</Bold> Withdraw consent for analytics at any time
          {'\n\n'}
          <Bold>Legal Basis for Processing:</Bold>
          {'\n'}• Contract: To provide VeilPath services
          {'\n'}• Legitimate Interest: To improve and secure the app
          {'\n'}• Consent: For analytics cookies (can be withdrawn)
          {'\n\n'}
          To exercise these rights, contact: {CONTACT_EMAIL}
          {'\n'}You also have the right to lodge a complaint with your local data protection authority.
        </Section>

        {/* CCPA Section */}
        <Section title="7. Your Rights (CCPA - California)">
          California residents have additional rights:
          {'\n\n'}• <Bold>Right to Know:</Bold> What personal information we collect and why
          {'\n'}• <Bold>Right to Delete:</Bold> Request deletion of your personal information
          {'\n'}• <Bold>Right to Opt-Out:</Bold> We do NOT sell personal information
          {'\n'}• <Bold>Non-Discrimination:</Bold> We will not discriminate against you for exercising rights
          {'\n\n'}
          <Bold>Categories of Information Collected:</Bold>
          {'\n'}• Identifiers (email, device ID)
          {'\n'}• Internet activity (usage data)
          {'\n'}• User-generated content (journal entries)
          {'\n\n'}
          <Bold>Do Not Sell My Personal Information:</Bold>
          {'\n'}VeilPath does NOT sell your personal information. We never have and never will.
        </Section>

        {/* Other Jurisdictions */}
        <Section title="8. Other Jurisdictions">
          <SubSection title="United Kingdom (UK GDPR)">
            UK residents have rights similar to EU GDPR. Our UK representative can be
            contacted at: {CONTACT_EMAIL}
          </SubSection>

          <SubSection title="Brazil (LGPD)">
            Brazilian users have rights to access, correction, deletion, and data portability.
            Contact our Data Protection Officer at: {CONTACT_EMAIL}
          </SubSection>

          <SubSection title="Australia (Privacy Act)">
            We comply with the Australian Privacy Principles (APPs).
            You can access and correct your data through the app or by contacting us.
          </SubSection>

          <SubSection title="Canada (PIPEDA)">
            Canadian users can access, correct, and withdraw consent for their personal information.
          </SubSection>
        </Section>

        {/* Cookies */}
        <Section title="9. Cookies and Tracking">
          <SubSection title="Essential Cookies">
            Required for authentication and basic functionality. Cannot be disabled.
          </SubSection>

          <SubSection title="Analytics Cookies">
            We use PostHog for privacy-focused analytics. You can opt-out via the cookie banner
            or in your account settings. PostHog is configured to:
            {'\n'}• NOT collect IP addresses
            {'\n'}• NOT use cross-site tracking
            {'\n'}• Anonymize user identifiers
          </SubSection>

          <SubSection title="No Marketing Cookies">
            We do not use advertising or marketing cookies.
          </SubSection>
        </Section>

        {/* Children */}
        <Section title="10. Children's Privacy">
          VeilPath is not intended for children under 13 (or 16 in EU).
          We do not knowingly collect data from children.
          If you believe a child has provided us data, contact us immediately for deletion.
        </Section>

        {/* International Transfers */}
        <Section title="11. International Data Transfers">
          Your data may be transferred to and processed in the United States.
          We use Standard Contractual Clauses (SCCs) and other safeguards for
          EU-US and other international transfers.
        </Section>

        {/* Changes */}
        <Section title="12. Changes to This Policy">
          We may update this Privacy Policy periodically.
          We will notify you of material changes via:
          {'\n\n'}• In-app notification
          {'\n'}• Email (for significant changes)
          {'\n'}• Updated "Effective Date" at the top
          {'\n\n'}
          Continued use after changes constitutes acceptance.
        </Section>

        {/* Contact */}
        <Section title="13. Contact Us">
          For privacy questions, requests, or concerns:
          {'\n\n'}
          <Bold>Email:</Bold> {CONTACT_EMAIL}
          {'\n'}
          <Bold>Data Protection Officer:</Bold> dpo@veilpath.app
          {'\n\n'}
          We will respond to requests within 30 days (or as required by law).
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy matters. We are committed to transparent data practices.
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

function SubSection({ title, children }) {
  return (
    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

function Bold({ children }) {
  return <Text style={styles.bold}>{children}</Text>;
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
    marginBottom: 20,
  },
  intro: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    marginBottom: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
  },
  subSection: {
    marginTop: 15,
    marginLeft: 10,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: COSMIC.deepAmethyst,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: COSMIC.etherealCyan,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COSMIC.deepAmethyst,
  },
  footerText: {
    fontSize: 14,
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
