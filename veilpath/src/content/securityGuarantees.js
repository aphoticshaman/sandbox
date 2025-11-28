/**
 * VEILPATH SECURITY & PRIVACY GUARANTEES
 *
 * This document describes our security architecture in both technical terms
 * (for security professionals) and plain English (for users).
 *
 * Use these constants in the Privacy Policy, Security page, and marketing.
 */

export const SECURITY_GUARANTEES = {
  /**
   * ZERO-KNOWLEDGE ENCRYPTION
   */
  zeroKnowledge: {
    title: 'Zero-Knowledge Encryption',

    layman: `Your data is encrypted with a password that only you know. We never see your password,
we never see your data. Even if hackers broke into our servers, all they would find is
scrambled nonsense. Even if we wanted to read your journals (we don't), we literally cannot.

Think of it like a safe deposit box where you have the only key, and we've never seen
the key and can't make a copy. If you lose the key (forget your password), the contents
are gone forever. That's the price of true privacy.`,

    technical: `Client-side encryption using AES-256-GCM with keys derived via PBKDF2 (600,000 iterations).
Key derivation occurs exclusively on-device using the user's password as input material.
The derived key never leaves the client's memory space.

Architecture:
- User password → PBKDF2 (SHA-256, 600k iterations, random salt) → AES-256 key
- All sensitive data encrypted before leaving device
- Server stores only encrypted blobs (base64-encoded: version || salt || iv || ciphertext || auth_tag)
- Decryption requires user password - server has no capability to decrypt

This implements a zero-knowledge architecture compliant with:
- NIST SP 800-132 (Password-Based Key Derivation)
- NIST SP 800-38D (AES-GCM)
- OWASP Cryptographic Storage Cheat Sheet

Note: If user forgets password, data is irrecoverably lost by design.`,
  },

  /**
   * DATA AT REST
   */
  dataAtRest: {
    title: 'Your Data at Rest',

    layman: `When your data is stored (on your device or our servers), it's encrypted.
Not "protected" or "secured" - actually encrypted, meaning turned into unreadable gibberish
without your password.

Your journals, your tarot readings, your reflections - they're all locked with a key
that only exists in your head. Not our developers, not our CEO, not hackers, not law
enforcement with a subpoena - nobody can read them without your password.`,

    technical: `Data-at-rest encryption layers:

1. LOCAL STORAGE (AsyncStorage/localStorage):
   - All sensitive stores (journal, readings) encrypted before persistence
   - Encryption key derived from user password (never stored)
   - Key cleared from memory on logout/app background

2. CLOUD STORAGE (Supabase):
   - Encrypted blobs synced to cloud for cross-device access
   - Server-side: encrypted_content column stores AES-256-GCM ciphertext
   - Metadata fields (id, timestamps) remain plaintext for indexing
   - Content, intentions, reflections always encrypted

3. DATABASE (Supabase PostgreSQL):
   - RLS (Row-Level Security) policies enforce user isolation
   - Even with DB access, only encrypted blobs visible
   - No master decryption key exists server-side

Sensitive data types encrypted:
- Journal entries (content, moods, therapeutic insights)
- Reading intentions and interpretations
- Chat history with Vera
- Personal reflections and notes`,
  },

  /**
   * DATA IN TRANSIT
   */
  dataInTransit: {
    title: 'Your Data in Transit',

    layman: `When your data travels over the internet (to sync between devices or talk to Vera),
it's double-encrypted. First by the standard internet encryption (like your bank uses),
and second by your personal encryption.

Even if someone intercepted the data mid-flight, they'd see encrypted data inside
encrypted data. It's like putting a locked safe inside another locked safe.

We refuse to send data over insecure connections. If something tries to connect
over plain HTTP (the insecure kind), we block it.`,

    technical: `Transport security layers:

1. TLS 1.3 (enforced):
   - All connections require HTTPS/WSS
   - HTTP connections rejected or upgraded
   - Certificate validation enforced
   - HSTS headers with 1-year max-age

2. Application-level encryption:
   - Data encrypted before transmission (E2E)
   - Even over TLS, data appears as encrypted blob
   - Protects against TLS termination attacks

3. API security:
   - Supabase connections: TLS + JWT auth
   - Claude API: TLS + API key auth
   - All third-party APIs: HTTPS-only

4. Streaming security (AI responses):
   - SSE streams over HTTPS only
   - Response validation before display
   - Output sanitization pipeline

Network security enforced via:
- secureFetch() wrapper blocking HTTP
- secureWebSocket() enforcing WSS
- secureEventSource() for SSE streams`,
  },

  /**
   * AI SECURITY
   */
  aiSecurity: {
    title: 'AI Interaction Security',

    layman: `When you talk to Vera (our AI guide), we take steps to ensure:

1. Your questions can't be weaponized - We check for tricks that could make the AI
   do something harmful.

2. Vera's responses are safe - We scan her responses for anything dangerous before
   showing them to you.

3. Your personal info stays private - We blur out things like email addresses and
   phone numbers before sending to the AI.

4. Nobody can abuse the system - We limit how fast anyone can send requests to
   prevent attacks.

Vera never stores your conversations for training. She helps you in the moment,
then forgets (unless you save something to your encrypted journal).`,

    technical: `MLSecOps implementation addressing OWASP LLM Top 10:

1. PROMPT INJECTION DEFENSE (LLM01):
   - Multi-layer input sanitization
   - Injection pattern detection (50+ patterns)
   - Unicode normalization (NFKC)
   - Delimiter escaping
   - Length limiting

2. INSECURE OUTPUT HANDLING (LLM02):
   - Response sanitization pipeline
   - HTML/script tag stripping
   - URL validation and flagging
   - Dangerous pattern detection

3. MODEL DENIAL OF SERVICE (LLM04):
   - Rate limiting: 20 req/min, 100 req/hr
   - Burst detection with cooldown
   - Token limiting per request

4. SENSITIVE INFO DISCLOSURE (LLM06):
   - PII redaction before AI context
   - Email, phone, SSN, card number masking
   - System prompt isolation

5. EXCESSIVE AGENCY (LLM08):
   - AI cannot execute system commands
   - Navigation requires verified user input
   - Action rate limiting

Implementation via aiSecurityService.js:
- secureAIRequest() wrapper for all AI calls
- Audit logging for security events
- Real-time threat detection`,
  },

  /**
   * ACCESS CONTROL
   */
  accessControl: {
    title: 'Who Can Access Your Data',

    layman: `Nobody but you. Period.

- VeilPath developers: CANNOT read your data (it's encrypted)
- VeilPath admins: CANNOT read your data (no master key exists)
- Hackers who breach our servers: CANNOT read your data (encryption)
- Law enforcement with subpoena: We can only hand over encrypted gibberish
- Whoever buys VeilPath someday: CANNOT read your data
- Our cloud providers (Supabase, etc.): CANNOT read your data

The only way to read your data is with YOUR password in YOUR hands on YOUR device.`,

    technical: `Access control architecture:

1. AUTHENTICATION:
   - Supabase Auth (bcrypt hashed passwords)
   - JWT tokens with short expiry
   - OAuth options (Google, Apple)
   - CAPTCHA protection (Turnstile)

2. AUTHORIZATION:
   - Supabase RLS policies
   - User can only access own rows
   - No admin bypass mechanism
   - No support access to user data

3. ENCRYPTION KEY MANAGEMENT:
   - Keys derived client-side only
   - No key escrow or recovery mechanism
   - No master key architecture
   - Key verification hash (not key) stored for password validation

4. OPERATIONAL SECURITY:
   - No database admin access to plaintext
   - Logging excludes sensitive data
   - No analytics on encrypted content
   - Audit trail for access attempts`,
  },

  /**
   * THIRD PARTY SECURITY
   */
  thirdPartySecurity: {
    title: 'Third-Party Services',

    layman: `We use a few external services to make VeilPath work:

- Supabase (database): Only stores encrypted blobs, can't read them
- Anthropic (Claude AI): Sees your questions to Vera, but we strip personal info first
- Cloudflare (CDN): Delivers the app securely, doesn't see user data

None of these services can decrypt your stored data. Your encryption password
never leaves your device.`,

    technical: `Third-party service security analysis:

1. SUPABASE:
   - Data stored: encrypted blobs, metadata
   - Access level: Ciphertext only
   - Risk mitigation: E2E encryption before storage
   - SOC 2 Type II compliant

2. ANTHROPIC (Claude API):
   - Data sent: Sanitized prompts (PII redacted)
   - Retention: No training on API data
   - Risk mitigation: Input sanitization, output filtering

3. CLOUDFLARE:
   - Data access: TLS termination, sees encrypted payloads
   - No persistent storage of user data
   - WAF protections active

4. APP STORES (Apple/Google):
   - No access to user data
   - App binary only

Supply chain security:
   - Dependency scanning via npm audit
   - Expo managed workflow (vetted native modules)
   - No native code with direct device access`,
  },

  /**
   * SECURITY CERTIFICATIONS
   */
  securityStandards: {
    title: 'Security Standards We Follow',

    layman: `We follow the same security practices used by banks and government agencies:

- Encryption standards approved by the U.S. government (AES-256)
- Password handling recommended by security experts (PBKDF2)
- Web security guidelines from OWASP (the security industry standard)
- AI safety guidelines specific to language models

We don't have fancy certificates on our wall (yet), but we built this app
with the same paranoia that protects nuclear secrets.`,

    technical: `Standards and frameworks implemented:

ENCRYPTION:
- NIST SP 800-132: Password-Based Key Derivation
- NIST SP 800-38D: AES-GCM Mode
- FIPS 197: AES Algorithm

WEB SECURITY:
- OWASP Top 10 2021 (addressed)
- OWASP ASVS Level 2 (target)
- OWASP Cryptographic Storage Cheat Sheet

AI/ML SECURITY:
- OWASP LLM Top 10 2023 (addressed)
- Anthropic Usage Policies

PRIVACY:
- GDPR principles (data minimization, purpose limitation)
- CCPA compliance considerations
- Privacy by Design principles

INFRASTRUCTURE:
- Supabase: SOC 2 Type II
- Cloudflare: SOC 2, ISO 27001
- Anthropic: SOC 2 (via API)`,
  },

  /**
   * WHAT WE CAN'T PROTECT AGAINST
   */
  limitations: {
    title: 'Honest Limitations',

    layman: `We're not magic. Here's what we can't protect against:

- Someone looking over your shoulder while you read your journal
- Malware on your device that screenshots everything
- You forgetting your encryption password (data is GONE forever)
- Government agencies with physical access to your unlocked device
- You sharing your password with someone untrustworthy
- Bugs in our code (we try hard, but we're human)

Security is a shared responsibility. We do our part; please do yours.`,

    technical: `Threat model limitations:

OUT OF SCOPE:
- Device compromise (root/jailbreak, malware, physical access)
- Shoulder surfing / visual eavesdropping
- User credential compromise (phishing, password reuse)
- Rubber hose cryptanalysis
- Nation-state adversaries with device access

ACCEPTED RISKS:
- Memory-resident key during active session
- Side-channel attacks on device
- Supply chain attacks on Expo/npm ecosystem
- Zero-day vulnerabilities in Web Crypto API

MITIGATIONS NOT IMPLEMENTED:
- Hardware security module (HSM) integration
- Secure enclave usage (would require native code)
- Certificate pinning (limited in React Native web)
- Binary obfuscation

KNOWN LIMITATIONS:
- Password-only key derivation (no 2FA for encryption)
- No key recovery mechanism
- Search requires decrypting all data client-side`,
  },
};

/**
 * PRIVACY POLICY SECTIONS
 * For legal compliance and user transparency
 */
export const PRIVACY_POLICY = {
  dataWeCollect: {
    title: 'Data We Collect',

    content: `We collect the minimum data necessary to provide VeilPath's features:

ACCOUNT DATA (if you create an account):
- Email address (for login and account recovery)
- Encrypted authentication tokens

USAGE DATA (encrypted, only you can read):
- Journal entries
- Tarot reading history and interpretations
- Chat conversations with Vera
- Mood tracking data
- Intentions and reflections

ANONYMOUS ANALYTICS (no personal data):
- App crashes (to fix bugs)
- Feature usage counts (to improve the app)
- Performance metrics

DATA WE NEVER COLLECT:
- Your real name (unless you tell us)
- Your location
- Your contacts
- Contents of your journals (we literally can't)
- Your encryption password`,
  },

  howWeUseData: {
    title: 'How We Use Your Data',

    content: `ACCOUNT DATA:
- To authenticate you when you log in
- To sync encrypted data across your devices
- To send password reset emails (if requested)

ENCRYPTED CONTENT:
- We don't "use" it - we can't read it
- We store encrypted blobs for your access only

ANONYMOUS ANALYTICS:
- To fix crashes and bugs
- To understand which features are popular
- To make the app faster

We will NEVER:
- Sell your data
- Use your data for advertising
- Train AI models on your data
- Share your data with third parties (except as needed to run the service)`,
  },

  dataRetention: {
    title: 'Data Retention',

    content: `YOUR ENCRYPTED DATA:
- Kept until you delete it
- You can export and delete anytime
- If you delete your account, all data is permanently removed

ANONYMOUS ANALYTICS:
- Aggregated data retained indefinitely
- No way to link back to you

ACCOUNT DATA:
- Kept while account is active
- Deleted within 30 days of account deletion
- Backup copies purged within 90 days`,
  },

  yourRights: {
    title: 'Your Rights',

    content: `You have the right to:

ACCESS: View all your data (it's in the app, encrypted)
EXPORT: Download your data in readable format
DELETE: Remove any or all of your data
PORTABILITY: Take your data elsewhere
OBJECT: Opt out of analytics

To exercise these rights:
- Use the in-app settings for most actions
- Email privacy@veilpath.app for account deletion
- We respond within 30 days`,
  },
};

/**
 * SECURITY FAQ
 * Common questions users ask
 */
export const SECURITY_FAQ = [
  {
    question: 'What happens if I forget my encryption password?',
    answer: `Your data is permanently lost. This is intentional - it's the price of true privacy.
We recommend writing down your password and storing it somewhere safe (not digitally).
We cannot recover your data, period.`,
  },
  {
    question: 'Can VeilPath employees read my journals?',
    answer: `No. Your journals are encrypted with a key derived from your password.
We never see your password, and there's no "master key" or backdoor.
Even if someone held a gun to our heads, we couldn't read your data.`,
  },
  {
    question: 'What if VeilPath gets hacked?',
    answer: `Hackers would get encrypted gibberish. Without your password, the data is useless.
This is why we use zero-knowledge encryption - even a total server breach
wouldn't expose your private content.`,
  },
  {
    question: 'Is my data safe if I use Google/Apple sign-in?',
    answer: `Yes. We use those services only for authentication (proving it's you).
Your encryption password is separate and never shared with Google/Apple.
They can't read your encrypted data either.`,
  },
  {
    question: 'Do you train AI on my conversations with Vera?',
    answer: `No. We use Anthropic's Claude API, which does not train on API conversations.
Your chats are processed, responded to, and forgotten by the AI.
If you want to keep something, save it to your encrypted journal.`,
  },
  {
    question: 'What data does the AI see?',
    answer: `When you ask Vera a question, we send a sanitized version that has personal
information (emails, phone numbers, etc.) removed. Vera sees your question,
responds, and doesn't retain it. Your encrypted journal/reading data is
never sent to the AI.`,
  },
  {
    question: 'Can law enforcement access my data?',
    answer: `If compelled by law, we could only hand over encrypted blobs that we cannot decrypt.
We literally don't have the ability to read your data. Law enforcement would
need your password, and we don't have it.`,
  },
  {
    question: 'What if VeilPath shuts down?',
    answer: `We'll give you plenty of notice to export your data. Your data remains encrypted
with your password even after export. We'd also consider open-sourcing the
decryption code so you could always access your data.`,
  },
];

export default {
  SECURITY_GUARANTEES,
  PRIVACY_POLICY,
  SECURITY_FAQ,
};
