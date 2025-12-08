// Legal Pages: Terms of Use & Privacy Policy
import { route } from '../core/router.js';
import { el } from '../ui/utils.js';

/**
 * Creates a sub-section with heading
 */
function SubSection(level, title, content) {
  const Tag = `h${level}`;
  return el('div', { class: 'legal-subsection' }, [
    el(Tag, {}, title),
    ...(Array.isArray(content) ? content : [content]),
  ]);
}

/**
 * Creates a paragraph element
 */
function P(text) {
  return el('p', {}, text);
}

/**
 * Creates an unordered list
 */
function UL(items) {
  return el(
    'ul',
    {},
    items.map((item) => el('li', {}, item)),
  );
}

/**
 * Build Terms of Use content
 */
function buildTermsContent() {
  return [
    el('p', { class: 'legal-intro' }, [
      'These Terms of Use ("Terms") govern your access to and use of the Virtual Standardized Patient Sim EMR (the "Service"), including any related websites, applications, content, and documentation provided by the UND PT Program ("we," "us," or "our").',
    ]),
    P(
      'By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.',
    ),

    SubSection(3, '1. Purpose of the Service – Educational Use Only', [
      SubSection(4, '1.1 Simulation / Training Tool', [
        P(
          'The Service is designed solely for educational and training purposes, including practice with clinical reasoning, documentation, and EMR workflows using fictional or de-identified cases.',
        ),
      ]),
      SubSection(4, '1.2 No Real-World Clinical Use', [
        P('The Service is not intended for:'),
        UL([
          'Documenting or managing real patient care,',
          'Delivering medical treatment, diagnosis, or triage, or',
          'Serving as an official medical record of any kind.',
        ]),
        P(
          'You must not rely on the Service for real-world clinical decision-making or emergency situations.',
        ),
      ]),
      SubSection(4, '1.3 No Medical Advice; No Provider–Patient Relationship', [
        P(
          'Content generated or displayed by the Service (including any AI-generated content or simulations) is not medical advice and does not create a provider–patient relationship. Users should rely on applicable clinical guidelines, supervision, and institutional policies for real clinical decisions.',
        ),
      ]),
    ]),

    SubSection(3, '2. HIPAA – No PHI / Health Information of Real Individuals', [
      SubSection(4, '2.1 Protected Health Information (PHI)', [
        P(
          'Under the Health Insurance Portability and Accountability Act (HIPAA), Protected Health Information ("PHI") generally includes individually identifiable health information created or received by a healthcare provider, health plan, or related entity that relates to the past, present, or future physical or mental health or payment for health care.',
        ),
      ]),
      SubSection(4, '2.2 Service Not Designed for PHI', [
        P(
          'The Service is not designed or intended to store, process, or transmit PHI as defined under HIPAA. The Service is not configured to satisfy the technical, administrative, and physical safeguards required for HIPAA-compliant systems.',
        ),
      ]),
      SubSection(4, '2.3 Prohibition on Entering PHI', [
        P(
          'You agree that you will not input, upload, or otherwise provide PHI or any health information that can reasonably identify a real person, including but not limited to the HIPAA 18 identifiers (e.g., names, full addresses, dates of birth, MRNs, phone numbers, email addresses, full-face photos, etc.).',
        ),
        P('All cases, scenarios, and documentation in the Service must be:'),
        UL([
          'Completely fictional, or',
          'Properly de-identified in accordance with applicable legal standards before being entered.',
        ]),
      ]),
      SubSection(4, '2.4 No Business Associate Role Without Separate Agreement', [
        P(
          'Unless we have executed a written Business Associate Agreement (BAA) with a covered entity or business associate, we do not act as a HIPAA Business Associate, and the Service must not be used as a repository for PHI. Any user who enters PHI in violation of these Terms remains solely responsible for HIPAA compliance and any resulting obligations.',
        ),
      ]),
    ]),

    SubSection(3, '3. FERPA – Student Records and Educational Use', [
      SubSection(4, '3.1 FERPA Overview', [
        P(
          'The Family Educational Rights and Privacy Act ("FERPA") protects the privacy of education records and personally identifiable information ("PII") contained in those records for students at educational institutions that receive federal funds.',
        ),
      ]),
      SubSection(4, '3.2 Intended Use With Simulated Data', [
        P(
          'The Service is intended to use simulated cases and educational scenarios, not official education records such as transcripts, official grades, or disciplinary files. You must not use the Service as your system of record for FERPA-protected education records unless separately agreed in writing.',
        ),
      ]),
      SubSection(4, '3.3 Institutional Responsibility', [
        P('If you are an educational institution, faculty member, or administrator:'),
        UL([
          'You are responsible for determining whether your use of the Service involves FERPA-protected education records or PII, and',
          "You must ensure that your use complies with FERPA and your institution's policies, including any requirements for written agreements with vendors and direct control over student data.",
        ]),
      ]),
      SubSection(4, '3.4 Student Accounts and Limited PII', [
        P(
          'We may process limited student information (e.g., names, institutional email addresses, usage data) as necessary to provide the Service. How we collect, use, and protect this information will be described in our Privacy Policy and, where applicable, in separate data-sharing agreements with institutions.',
        ),
      ]),
      SubSection(4, '3.5 No Uploading of Unnecessary Student PII', [
        P(
          'You agree not to upload or store more student PII than is necessary for educational use of the Service. Do not upload gradebooks, official academic records, or sensitive non-essential student information unless expressly permitted in a written agreement.',
        ),
      ]),
    ]),

    SubSection(3, '4. User Responsibilities', [
      SubSection(4, '4.1 Account Security', [
        P(
          'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
        ),
      ]),
      SubSection(4, '4.2 Acceptable Use', [
        P('You agree not to:'),
        UL([
          'Use the Service to store PHI or real patient records;',
          'Use the Service to store official education records except as allowed by your institution and applicable law;',
          'Attempt to reverse engineer, disrupt, or compromise the Service;',
          'Use the Service for any illegal, harmful, or unauthorized purpose.',
        ]),
      ]),
      SubSection(4, '4.3 Accuracy of Input', [
        P(
          'All cases and documentation you enter must accurately represent fictional or de-identified training scenarios. You remain responsible for the quality and legality of any content you contribute.',
        ),
      ]),
    ]),

    SubSection(3, '5. Intellectual Property', [
      SubSection(4, '5.1 Our Rights', [
        P(
          'The Service and all associated content, software, and design elements (excluding User Content defined below) are owned by us or our licensors and are protected by copyright, trademark, and other laws.',
        ),
      ]),
      SubSection(4, '5.2 Limited License to You', [
        P(
          'Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for educational and training purposes only.',
        ),
      ]),
      SubSection(4, '5.3 User Content', [
        P(
          'You retain whatever rights you have in cases, notes, and other content you enter into the Service ("User Content"). By submitting User Content, you grant us a non-exclusive license to host, process, display, and use that content solely to operate, maintain, improve, and support the Service and its educational features.',
        ),
      ]),
    ]),

    SubSection(3, '6. Data, Privacy, and Security', [
      SubSection(4, '6.1 Privacy Policy', [
        P(
          'Our collection, use, and disclosure of personal data (including student account information) is described in our separate Privacy Policy, which is incorporated into these Terms by reference. Please review it carefully.',
        ),
      ]),
      SubSection(4, '6.2 Security Practices', [
        P(
          'We implement reasonable administrative, technical, and physical safeguards designed to protect data within the Service. However, no system can be guaranteed to be 100% secure. You are responsible for using the Service in a manner that is consistent with your institutional security requirements and these Terms.',
        ),
      ]),
      SubSection(4, '6.3 Data Retention and Deletion', [
        P(
          'We may retain User Content and account data for as long as necessary to provide the Service, comply with legal obligations, or as otherwise described in our Privacy Policy. You or your institution may request deletion of certain data as permitted by our policies and applicable law.',
        ),
      ]),
    ]),

    SubSection(3, '7. Disclaimers', [
      SubSection(4, '7.1 "As-Is" Educational Service', [
        P(
          'The Service is provided on an "AS IS" and "AS AVAILABLE" basis, for educational and training purposes only. To the maximum extent permitted by law, we disclaim all warranties, whether express or implied, including any implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
        ),
      ]),
      SubSection(4, '7.2 No Guarantee of Accuracy', [
        P(
          'Simulation cases, AI-generated content, and documentation tools may be incomplete, outdated, or incorrect. You are responsible for independently verifying any information before relying on it for teaching, assessment, or curriculum decisions.',
        ),
      ]),
      SubSection(4, '7.3 No Emergency or Clinical Service', [
        P(
          "The Service may not be used for emergency communication or real patient care. If you have a medical emergency, call emergency services or follow your institution's clinical protocols.",
        ),
      ]),
    ]),

    SubSection(3, '8. Limitation of Liability', [
      P(
        'To the maximum extent permitted by law, in no event will we be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising out of or in connection with your use of (or inability to use) the Service, whether based on warranty, contract, tort, or any other legal theory, even if we have been advised of the possibility of such damages.',
      ),
      P(
        'Our total aggregate liability for any claim arising out of or relating to the Service or these Terms will not exceed the amount you have paid to us for access to the Service in the twelve (12) months preceding the event giving rise to the claim (or, if you have not paid, one hundred U.S. dollars (US $100)).',
      ),
      P(
        'Some jurisdictions do not allow certain limitations of liability; in those jurisdictions, these limitations apply only to the extent permitted by law.',
      ),
    ]),

    SubSection(3, '9. Indemnification', [
      P(
        "You agree to indemnify, defend, and hold harmless us and our officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to:",
      ),
      UL([
        'Your use of the Service,',
        'Your violation of these Terms, or',
        'Your submission or misuse of User Content (including any improper entry of PHI or FERPA-protected education records).',
      ]),
    ]),

    SubSection(3, '10. Changes to the Service and Terms', [
      P(
        'We may modify or discontinue the Service (in whole or in part) at any time. We may also update these Terms from time to time. When we make material changes, we will update the "Last Updated" date and may provide additional notice as appropriate. Your continued use of the Service after changes become effective constitutes your acceptance of the revised Terms.',
      ),
    ]),

    SubSection(3, '11. Governing Law', [
      P(
        'These Terms shall be governed by and construed in accordance with the laws of the State of North Dakota, without regard to its conflict-of-law principles. Any disputes arising out of or relating to these Terms or the Service shall be resolved in the courts located in Grand Forks County, North Dakota, and you consent to the jurisdiction of such courts.',
      ),
    ]),

    SubSection(3, '12. Contact', [
      P(
        'If you have questions about these Terms, HIPAA/FERPA restrictions, or the Service, please contact us at:',
      ),
      el('address', { class: 'legal-contact' }, [
        el('p', {}, 'University of North Dakota'),
        el('p', {}, 'Department of Physical Therapy'),
        el('p', {}, ['Email: ', el('a', { href: 'mailto:pt@UND.edu' }, 'pt@UND.edu')]),
      ]),
    ]),
  ];
}

/**
 * Build Privacy Policy content
 */
function buildPrivacyContent() {
  return [
    el('p', { class: 'legal-intro' }, [
      'This Privacy Policy explains how the UND PT Program ("we," "us," or "our") collects, uses, discloses, and safeguards information when you use the Virtual Standardized Patient Sim EMR and related websites, applications, and services (collectively, the "Service").',
    ]),
    P(
      'The Service is designed solely for educational and training purposes and is not intended for real patient care or for maintaining official medical or academic records.',
    ),
    P(
      'By using the Service, you consent to the practices described in this Privacy Policy. If you do not agree, please do not use the Service.',
    ),

    SubSection(3, '1. Scope and Role', [
      P('This Privacy Policy applies to:'),
      UL([
        'Visitors to our website,',
        'Individual users (e.g., faculty, students, trainees) who access the Service directly, and',
        'Institutional customers (e.g., universities and training programs) and their authorized users.',
      ]),
      P(
        'If we have a separate written agreement (e.g., a data protection addendum) with an institution, that agreement may supplement or modify this Privacy Policy for users associated with that institution.',
      ),
    ]),

    SubSection(3, '2. Information We Collect', [
      SubSection(4, '2.1 Information You Provide Directly', [
        P('We may collect information that you provide when you:'),
        UL([
          'Create an account or profile (e.g., name, institutional email address, role/position, password or authentication credentials),',
          'Complete your profile or settings (e.g., institution, program, graduating class),',
          'Enter or interact with simulated patient cases, documentation, and other educational content,',
          'Communicate with us (e.g., support requests, feedback, surveys).',
        ]),
        el(
          'p',
          { class: 'legal-important' },
          'Important: The Service is designed for fictional or de-identified educational scenarios only. You must not enter real patient information that qualifies as protected health information (PHI) under the HIPAA Privacy Rule.',
        ),
      ]),
      SubSection(4, '2.2 Information From Your Institution', [
        P(
          'If you use the Service through an educational institution or training program, we may receive limited information from that institution, such as:',
        ),
        UL([
          'Your name and institutional email address,',
          'Your role (e.g., student, faculty, preceptor),',
          'Course or cohort information,',
          'Rosters or enrollment information needed to set up and manage accounts and groups.',
        ]),
        P(
          'Under the Family Educational Rights and Privacy Act (FERPA), "education records" are records directly related to a student and maintained by an educational agency or institution or a party acting on its behalf. We process such information only as authorized by the institution.',
        ),
      ]),
      SubSection(4, '2.3 User Content (Educational / Simulation Data)', [
        P('We process the educational content you enter into the Service, including:'),
        UL([
          'Simulated histories, physical exam findings, orders, and documentation,',
          'Notes, feedback, and reflections on simulated encounters,',
          'Assessment rubric scores and other training-related data (where applicable).',
        ]),
        P(
          'You are responsible for ensuring that all User Content is fictional or properly de-identified and does not contain PHI or other sensitive real-world identifiers.',
        ),
      ]),
      SubSection(4, '2.4 Automatically Collected Information', [
        P(
          'When you access or use the Service, we may automatically collect certain information, such as:',
        ),
        UL([
          'Device and browser information (e.g., IP address, browser type, operating system),',
          'Log data (e.g., pages viewed, features used, timestamps, crash or error reports),',
          'Approximate location derived from IP address (e.g., city/region level),',
          'Session and usage metrics (e.g., frequency and duration of use, clickstream data).',
        ]),
        P('We may use cookies, local storage, and similar technologies to support:'),
        UL([
          'Essential functionality (e.g., session management, authentication),',
          'Preferences (e.g., UI settings),',
          'Analytics (e.g., understanding how the Service is used to improve teaching tools).',
        ]),
        P(
          'You can control certain cookie behaviors via browser settings, but disabling essential cookies may prevent the Service from functioning properly.',
        ),
      ]),
    ]),

    SubSection(3, '3. How We Use Information', [
      P('We use the information we collect for the following purposes:'),
      SubSection(4, 'Provide and operate the Service', [
        UL([
          'Creating and managing user accounts,',
          'Delivering simulation features, documentation tools, grading/feedback workflows, and dashboards.',
        ]),
      ]),
      SubSection(4, 'Support teaching, learning, and assessment', [
        UL([
          'Allowing faculty to view and assess student work within the Service,',
          'Providing students with feedback, history of simulated cases, and learning analytics.',
        ]),
      ]),
      SubSection(4, 'Maintain security and integrity', [
        UL([
          'Authenticating users, preventing unauthorized access, detecting fraud or abuse, and monitoring system performance.',
        ]),
      ]),
      SubSection(4, 'Improve and develop the Service', [
        UL([
          'Troubleshooting issues, analyzing usage trends, and enhancing features based on aggregated or de-identified data.',
        ]),
      ]),
      SubSection(4, 'Communicate with you', [
        UL([
          'Sending administrative messages, updates about changes to the Service or this Policy, and responding to support requests.',
        ]),
      ]),
      SubSection(4, 'Comply with legal obligations', [
        UL([
          'Satisfying applicable laws, regulations, and institutional obligations, or responding to legitimate legal requests.',
        ]),
      ]),
      P(
        'We may de-identify or aggregate data so that it no longer reasonably identifies an individual or institution, and use such data for research, analytics, and product development.',
      ),
    ]),

    SubSection(3, '4. Legal Bases for Processing (EEA/UK Users)', [
      P(
        'If you are located in the European Economic Area (EEA), the United Kingdom, or similar jurisdictions, our legal bases for processing personal data may include:',
      ),
      UL([
        'Performance of a contract (e.g., providing the Service to you or your institution),',
        'Legitimate interests (e.g., improving the Service, maintaining security),',
        'Compliance with legal obligations, and',
        'Consent, where required (e.g., certain cookies or marketing communications).',
      ]),
      P(
        'Where we rely on consent, you may withdraw it at any time, without affecting the lawfulness of processing based on consent before its withdrawal.',
      ),
    ]),

    SubSection(3, '5. How We Share Information', [
      P('We do not sell personal information.'),
      P('We may share information in the following circumstances:'),
      SubSection(4, 'Service providers and vendors', [
        P(
          'We use trusted third-party service providers (e.g., hosting providers, email services, analytics, error logging, AI processing services) who process data on our behalf and under our instructions. They are contractually obligated to protect your information and use it only for the purposes we specify.',
        ),
      ]),
      SubSection(4, 'Educational institutions', [
        P(
          'If you use the Service through a school or training program, we may share relevant data with that institution (e.g., usage, performance metrics, and User Content associated with that institution). Institutions may use this data for teaching, assessment, accreditation, and program improvement, subject to their own policies and FERPA.',
        ),
      ]),
      SubSection(4, 'Legal and safety reasons', [
        P('We may disclose information when we believe in good faith that it is necessary to:'),
        UL([
          'Comply with a law, regulation, legal process, or governmental request,',
          'Protect the rights, property, or safety of us, our users, or others,',
          'Investigate and prevent potential violations of our Terms of Use.',
        ]),
      ]),
      SubSection(4, 'Business transfers', [
        P(
          'If we are involved in a merger, acquisition, reorganization, or sale of assets, information may be transferred as part of that transaction, subject to applicable law and continued protection consistent with this Policy.',
        ),
      ]),
      SubSection(4, 'With your direction or consent', [
        P(
          'We may share information with third parties when you explicitly request or consent to such sharing.',
        ),
      ]),
    ]),

    SubSection(3, '6. HIPAA and PHI', [
      P(
        'The HIPAA Privacy Rule applies to "covered entities" (such as certain healthcare providers and health plans) and their "business associates," and protects "individually identifiable health information," referred to as Protected Health Information (PHI).',
      ),
      UL([
        'We do not design or market the Service as a HIPAA-compliant platform.',
        'We do not enter into Business Associate Agreements (BAAs) by default.',
        'The Service is intended for simulated or de-identified training data only.',
      ]),
      el(
        'p',
        { class: 'legal-important' },
        'You must not enter PHI into the Service. PHI generally includes health information combined with identifiers (such as name, full address, dates of birth, medical record numbers, etc.) that can identify an individual.',
      ),
      P(
        'If we become aware that the Service contains PHI in violation of these rules, we may delete or de-identify such information and may request that you or your institution take additional steps to prevent recurrence.',
      ),
    ]),

    SubSection(3, '7. FERPA and Student Information', [
      P(
        'For institutions subject to FERPA, "education records" include records directly related to a student and maintained by the institution or a party acting on its behalf, such as grades, schedules, and other personally identifiable information.',
      ),
      P('When an institution licenses the Service:'),
      UL([
        'We typically act as a "school official" with a legitimate educational interest, under the direct control of the institution, as permitted by FERPA and related guidance.',
        'We process student-related information only to provide and support the educational functions of the Service (e.g., simulation, feedback, assessment, and analytics).',
        'We do not disclose FERPA-protected education records to third parties except as authorized in writing by the institution or eligible student, as required by law, or as permitted by FERPA regulations and institutional policies.',
      ]),
      P(
        'Institutions remain responsible for providing access to, or amendments of, education records, and for handling FERPA requests. We assist institutions in fulfilling those obligations as agreed in our contracts.',
      ),
    ]),

    SubSection(3, "8. Children's Privacy", [
      P(
        'The Service is primarily intended for adult learners (e.g., university-level students and healthcare trainees) and is not directed to children under 13 years of age.',
      ),
      P(
        "Under the Children's Online Privacy Protection Act (COPPA), online services that collect personal information from children under 13 must obtain verifiable parental consent and meet specific requirements.",
      ),
      P(
        'We do not knowingly collect personal information from children under 13. If we learn that we have inadvertently collected such information, we will take reasonable steps to delete it. If you believe a child under 13 has provided personal information through the Service, please contact us promptly.',
      ),
    ]),

    SubSection(3, '9. Data Security', [
      P(
        'We implement reasonable administrative, technical, and physical safeguards designed to protect information within the Service from unauthorized access, use, or disclosure. These measures may include encryption in transit, access controls, logging, and secure development practices.',
      ),
      P(
        'However, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security, and you are responsible for maintaining the confidentiality of your login credentials and for promptly notifying us of any suspected compromise.',
      ),
    ]),

    SubSection(3, '10. Data Retention', [
      P('We retain information for as long as reasonably necessary to:'),
      UL([
        'Provide and maintain the Service,',
        'Support institutional programs (e.g., course terms, accreditation cycles),',
        'Comply with legal, regulatory, or contractual obligations,',
        'Resolve disputes and enforce our agreements.',
      ]),
      P(
        'Institutions and individual users may request deletion of certain data, subject to our agreements and applicable law. We may retain de-identified or aggregated data that no longer reasonably identifies an individual or institution.',
      ),
    ]),

    SubSection(3, '11. International Data Transfers', [
      P(
        'Our servers and primary service providers may be located in the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States or other countries where our service providers are located.',
      ),
      P(
        'Where required by law, we will implement appropriate safeguards (such as standard contractual clauses or equivalent mechanisms) to protect personal data transferred from the EEA, UK, or similar jurisdictions.',
      ),
    ]),

    SubSection(3, '12. Your Rights and Choices', [
      P(
        'Depending on your jurisdiction and your relationship with us, you may have certain rights regarding your personal information, such as:',
      ),
      UL([
        'Access and correction – to request access to and correction of your personal information,',
        'Deletion – to request deletion of certain information, subject to legal and contractual limits,',
        'Restriction or objection – to restrict or object to certain processing,',
        'Data portability – to request a copy of certain information in a structured, commonly used format,',
        'Opt-out of marketing – to opt out of non-essential communications.',
      ]),
      P(
        'If you are a student using the Service through an institution, many of these requests (especially those involving education records) must be directed to your institution, which controls those records under FERPA. We will cooperate with institutions to help respond to such requests.',
      ),
      P(
        'To exercise any rights, please contact us at the email address below. We may ask you to verify your identity before responding.',
      ),
    ]),

    SubSection(3, '13. Third-Party Sites and Services', [
      P(
        'The Service may contain links to third-party websites, applications, or services that are not operated by us. This Privacy Policy does not apply to those third parties, and we are not responsible for their content or privacy practices. We encourage you to review the privacy policies of any third-party services you visit or use.',
      ),
    ]),

    SubSection(3, '14. Changes to This Privacy Policy', [
      P(
        'We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last Updated" date at the top of this page and may provide additional notice (such as an in-app message or email). Your continued use of the Service after the effective date of any changes indicates your acceptance of the updated Policy.',
      ),
    ]),

    SubSection(3, '15. Contact Us', [
      P(
        'If you have questions about this Privacy Policy, our data practices, or your choices, please contact us at:',
      ),
      el('address', { class: 'legal-contact' }, [
        el('p', {}, 'University of North Dakota'),
        el('p', {}, 'Department of Physical Therapy'),
        el('p', {}, ['Email: ', el('a', { href: 'mailto:pt@UND.edu' }, 'pt@UND.edu')]),
      ]),
    ]),
  ];
}

/**
 * Navigation tabs for switching between Terms and Privacy
 */
function LegalTabs(activeTab, onTabChange) {
  const tabs = [
    { id: 'terms', label: 'Terms of Use' },
    { id: 'privacy', label: 'Privacy Policy' },
  ];

  return el(
    'div',
    { class: 'legal-tabs', role: 'tablist', 'aria-label': 'Legal document sections' },
    tabs.map((tab) =>
      el(
        'button',
        {
          class: `legal-tab ${activeTab === tab.id ? 'active' : ''}`,
          role: 'tab',
          'aria-selected': activeTab === tab.id ? 'true' : 'false',
          'aria-controls': `${tab.id}-panel`,
          id: `${tab.id}-tab`,
          onClick: () => onTabChange(tab.id),
        },
        tab.label,
      ),
    ),
  );
}

/**
 * Main legal page route
 */
route('#/legal', async (app, qs) => {
  app.replaceChildren();

  // Determine which tab to show (default to terms, or from query string)
  let activeTab = qs.get('tab') || 'terms';
  if (!['terms', 'privacy'].includes(activeTab)) {
    activeTab = 'terms';
  }

  const lastUpdated = 'December 8, 2024';

  function renderContent(tab) {
    const isTerms = tab === 'terms';
    return el(
      'div',
      {
        class: 'legal-panel',
        role: 'tabpanel',
        id: `${tab}-panel`,
        'aria-labelledby': `${tab}-tab`,
      },
      [
        el('header', { class: 'legal-header' }, [
          el('h1', {}, isTerms ? 'Terms of Use' : 'Privacy Policy'),
          el('p', { class: 'legal-subtitle' }, 'Virtual Standardized Patient Sim EMR'),
          el(
            'p',
            { class: 'legal-subtitle' },
            isTerms ? '(Educational Simulation Platform – Not for Real Patient Care)' : '',
          ),
          el('p', { class: 'legal-date' }, `Last Updated: ${lastUpdated}`),
        ]),
        el(
          'article',
          { class: 'legal-body' },
          isTerms ? buildTermsContent() : buildPrivacyContent(),
        ),
      ],
    );
  }

  function render() {
    const container = el('main', { class: 'legal-page' }, [
      LegalTabs(activeTab, (newTab) => {
        activeTab = newTab;
        // Update URL without full navigation
        const newHash = `#/legal?tab=${newTab}`;
        history.replaceState(null, '', newHash);
        // Re-render
        app.replaceChildren();
        app.appendChild(render());
      }),
      renderContent(activeTab),
    ]);
    return container;
  }

  app.appendChild(render());
});

// Also register direct routes for terms and privacy
route('#/terms', async () => {
  window.location.hash = '#/legal?tab=terms';
});

route('#/privacy', async () => {
  window.location.hash = '#/legal?tab=privacy';
});
