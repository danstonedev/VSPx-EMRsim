<script lang="ts">
  let activeTab = $state<'terms' | 'privacy'>('terms');
</script>

<svelte:head>
  <title>{activeTab === 'terms' ? 'Terms of Use' : 'Privacy Policy'} | UND EMR-Sim</title>
</svelte:head>

<main class="legal-page">
  <div class="legal-tabs" role="tablist" aria-label="Legal document sections">
    <button
      type="button"
      id="tab-terms"
      class="legal-tab"
      class:active={activeTab === 'terms'}
      role="tab"
      aria-selected={activeTab === 'terms'}
      aria-controls="panel-legal"
      tabindex={activeTab === 'terms' ? 0 : -1}
      onclick={() => (activeTab = 'terms')}>Terms of Use</button
    >
    <button
      type="button"
      id="tab-privacy"
      class="legal-tab"
      class:active={activeTab === 'privacy'}
      role="tab"
      aria-selected={activeTab === 'privacy'}
      aria-controls="panel-legal"
      tabindex={activeTab === 'privacy' ? 0 : -1}
      onclick={() => (activeTab = 'privacy')}>Privacy Policy</button
    >
  </div>

  <div
    id="panel-legal"
    class="legal-panel"
    role="tabpanel"
    aria-labelledby={activeTab === 'terms' ? 'tab-terms' : 'tab-privacy'}
    tabindex="-1"
  >
    <header class="legal-header">
      <p class="legal-draft-notice">// DRAFT //</p>
      <h1>{activeTab === 'terms' ? 'Terms of Use' : 'Privacy Policy'}</h1>
      <p class="legal-subtitle">Virtual Standardized Patient Sim EMR</p>
      {#if activeTab === 'terms'}
        <p class="legal-subtitle">(Educational Simulation Platform – Not for Real Patient Care)</p>
      {/if}
      <p class="legal-date">Last Updated: December 8, 2024</p>
    </header>

    <article class="legal-body">
      {#if activeTab === 'terms'}
        <p class="legal-intro">
          These Terms of Use ("Terms") govern your access to and use of the Virtual Standardized
          Patient Sim EMR (the "Service"), including any related websites, applications, content,
          and documentation provided by the UND PT Program ("we," "us," or "our").
        </p>
        <p>
          By accessing or using the Service, you agree to be bound by these Terms. If you do not
          agree, do not use the Service.
        </p>

        <h3>1. Purpose of the Service – Educational Use Only</h3>
        <h4>1.1 Simulation / Training Tool</h4>
        <p>
          The Service is designed solely for educational and training purposes, including practice
          with clinical reasoning, documentation, and EMR workflows using fictional or de-identified
          cases.
        </p>
        <h4>1.2 No Real-World Clinical Use</h4>
        <p>The Service is not intended for:</p>
        <ul>
          <li>Documenting or managing real patient care,</li>
          <li>Delivering medical treatment, diagnosis, or triage, or</li>
          <li>Serving as an official medical record of any kind.</li>
        </ul>
        <p>
          You must not rely on the Service for real-world clinical decision-making or emergency
          situations.
        </p>
        <h4>1.3 No Medical Advice; No Provider–Patient Relationship</h4>
        <p>
          Content generated or displayed by the Service (including any AI-generated content or
          simulations) is not medical advice and does not create a provider–patient relationship.
        </p>

        <h3>2. HIPAA – No PHI / Health Information of Real Individuals</h3>
        <h4>2.1 Protected Health Information (PHI)</h4>
        <p>
          Under HIPAA, Protected Health Information ("PHI") generally includes individually
          identifiable health information created or received by a healthcare provider that relates
          to the past, present, or future physical or mental health or payment for health care.
        </p>
        <h4>2.2 Service Not Designed for PHI</h4>
        <p>
          The Service is not designed or intended to store, process, or transmit PHI as defined
          under HIPAA. The Service is not configured to satisfy the technical, administrative, and
          physical safeguards required for HIPAA-compliant systems.
        </p>
        <h4>2.3 Prohibition on Entering PHI</h4>
        <p>
          You agree that you will not input, upload, or otherwise provide PHI or any health
          information that can reasonably identify a real person, including but not limited to the
          HIPAA 18 identifiers.
        </p>
        <p>All cases, scenarios, and documentation in the Service must be:</p>
        <ul>
          <li>Completely fictional, or</li>
          <li>
            Properly de-identified in accordance with applicable legal standards before being
            entered.
          </li>
        </ul>
        <h4>2.4 No Business Associate Role Without Separate Agreement</h4>
        <p>
          Unless we have executed a written Business Associate Agreement (BAA) with a covered
          entity, we do not act as a HIPAA Business Associate, and the Service must not be used as a
          repository for PHI.
        </p>

        <h3>3. FERPA – Student Records and Educational Use</h3>
        <h4>3.1 FERPA Overview</h4>
        <p>
          The Family Educational Rights and Privacy Act ("FERPA") protects the privacy of education
          records and personally identifiable information ("PII") contained in those records for
          students at educational institutions that receive federal funds.
        </p>
        <h4>3.2 Intended Use With Simulated Data</h4>
        <p>
          The Service is intended to use simulated cases and educational scenarios, not official
          education records such as transcripts, official grades, or disciplinary files.
        </p>
        <h4>3.3 Institutional Responsibility</h4>
        <p>If you are an educational institution, faculty member, or administrator:</p>
        <ul>
          <li>
            You are responsible for determining whether your use involves FERPA-protected education
            records or PII, and
          </li>
          <li>You must ensure compliance with FERPA and your institution's policies.</li>
        </ul>

        <h3>4. User Responsibilities</h3>
        <h4>4.1 Account Security</h4>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity under your account.
        </p>
        <h4>4.2 Acceptable Use</h4>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service to store PHI or real patient records;</li>
          <li>Use the Service to store official education records except as allowed;</li>
          <li>Attempt to reverse engineer, disrupt, or compromise the Service;</li>
          <li>Use the Service for any illegal, harmful, or unauthorized purpose.</li>
        </ul>

        <h3>5. Intellectual Property</h3>
        <h4>5.1 Our Rights</h4>
        <p>
          The Service and all associated content, software, and design elements are owned by us or
          our licensors and are protected by copyright, trademark, and other laws.
        </p>
        <h4>5.2 Limited License to You</h4>
        <p>
          Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable
          license to use the Service for educational and training purposes only.
        </p>

        <h3>6. Data, Privacy, and Security</h3>
        <p>
          Our collection, use, and disclosure of personal data is described in our Privacy Policy,
          which is incorporated into these Terms by reference.
        </p>

        <h3>7. Disclaimers</h3>
        <h4>7.1 "As-Is" Educational Service</h4>
        <p>
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis for educational purposes
          only. To the maximum extent permitted by law, we disclaim all warranties, whether express
          or implied.
        </p>
        <h4>7.2 No Guarantee of Accuracy</h4>
        <p>
          Simulation cases, AI-generated content, and documentation tools may be incomplete,
          outdated, or incorrect.
        </p>

        <h3>8. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, we will not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising out of your use of the
          Service.
        </p>

        <h3>9. Indemnification</h3>
        <p>
          You agree to indemnify, defend, and hold harmless us from any claims arising from your use
          of the Service, your violation of these Terms, or your submission of User Content.
        </p>

        <h3>10. Governing Law</h3>
        <p>
          These Terms shall be governed by the laws of the State of North Dakota. Any disputes shall
          be resolved in the courts of Grand Forks County, North Dakota.
        </p>

        <h3>11. Contact</h3>
        <address class="legal-contact">
          <p>University of North Dakota</p>
          <p>Department of Physical Therapy</p>
          <p>Email: <a href="mailto:pt@UND.edu">pt@UND.edu</a></p>
        </address>
      {:else}
        <p class="legal-intro">
          This Privacy Policy explains how we collect, use, disclose, and safeguard information when
          you use the Virtual Standardized Patient Sim EMR and related services (the "Service").
        </p>
        <p>
          The Service is designed solely for educational and training purposes and is not intended
          for real patient care.
        </p>

        <h3>1. Scope and Role</h3>
        <p>
          This Privacy Policy applies to visitors, individual users (faculty, students, trainees),
          and institutional customers with their authorized users.
        </p>

        <h3>2. Information We Collect</h3>
        <h4>2.1 Information You Provide Directly</h4>
        <p>
          We may collect information you provide when creating an account, completing your profile,
          entering simulated patient cases, or communicating with us.
        </p>
        <p class="legal-important">
          Important: The Service is designed for fictional or de-identified educational scenarios
          only. You must not enter real patient information (PHI).
        </p>
        <h4>2.2 Information From Your Institution</h4>
        <p>
          If you use the Service through an educational institution, we may receive limited
          information such as your name, institutional email, role, course, or enrollment
          information.
        </p>
        <h4>2.3 User Content (Educational / Simulation Data)</h4>
        <p>
          We process the educational content you enter, including simulated histories,
          documentation, notes, and assessment data.
        </p>
        <h4>2.4 Automatically Collected Information</h4>
        <p>
          We may automatically collect device and browser info, log data, approximate location, and
          session metrics. We may use cookies, local storage, and similar technologies.
        </p>

        <h3>3. How We Use Information</h3>
        <ul>
          <li>Provide and operate the Service (accounts, simulation features, dashboards)</li>
          <li>Support teaching, learning, and assessment</li>
          <li>Maintain security and integrity</li>
          <li>Improve and develop the Service</li>
          <li>Communicate with you</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h3>4. How We Share Information</h3>
        <p>
          We do not sell personal information. We may share with service providers, educational
          institutions, for legal or safety reasons, in business transfers, or with your consent.
        </p>

        <h3>5. HIPAA and PHI</h3>
        <ul>
          <li>We do not design or market the Service as HIPAA-compliant.</li>
          <li>We do not enter into BAAs by default.</li>
          <li>The Service is intended for simulated or de-identified data only.</li>
        </ul>
        <p class="legal-important">You must not enter PHI into the Service.</p>

        <h3>6. FERPA and Student Information</h3>
        <p>
          When an institution licenses the Service, we typically act as a "school official" with a
          legitimate educational interest. We process student information only to support teaching,
          assessment, and analytics.
        </p>

        <h3>7. Children's Privacy</h3>
        <p>
          The Service is intended for adult learners. We do not knowingly collect personal
          information from children under 13.
        </p>

        <h3>8. Data Security</h3>
        <p>
          We implement reasonable administrative, technical, and physical safeguards. However, no
          system can guarantee absolute security.
        </p>

        <h3>9. Data Retention</h3>
        <p>
          We retain information as long as reasonably necessary to provide the Service, support
          programs, comply with obligations, and resolve disputes.
        </p>

        <h3>10. Your Rights and Choices</h3>
        <p>
          Depending on your jurisdiction, you may have rights including access, correction,
          deletion, restriction, data portability, and opt-out of marketing.
        </p>

        <h3>11. Changes to This Privacy Policy</h3>
        <p>
          We may update this Policy from time to time. Material changes will be indicated by
          updating the "Last Updated" date.
        </p>

        <h3>12. Contact Us</h3>
        <address class="legal-contact">
          <p>University of North Dakota</p>
          <p>Department of Physical Therapy</p>
          <p>Email: <a href="mailto:pt@UND.edu">pt@UND.edu</a></p>
        </address>
      {/if}
    </article>
  </div>
</main>

<style>
  .legal-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .legal-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-neutral-200, #e5e5e5);
    margin-bottom: 2rem;
  }

  .legal-tab {
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-neutral-500, #737373);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition:
      color 0.15s,
      border-color 0.15s;
  }

  .legal-tab:hover {
    color: var(--color-brand-green, #009a44);
  }

  .legal-tab.active {
    color: var(--color-brand-green, #009a44);
    border-bottom-color: var(--color-brand-green, #009a44);
  }

  .legal-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  .legal-draft-notice {
    color: var(--color-brand-orange, #ff671f);
    font-weight: 700;
    font-size: 0.875rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }

  .legal-header h1 {
    font-size: 1.75rem;
    margin: 0 0 0.5rem;
  }

  .legal-subtitle {
    color: var(--color-neutral-500, #737373);
    font-size: 0.9375rem;
    margin: 0 0 0.25rem;
  }

  .legal-date {
    color: var(--color-neutral-400, #a3a3a3);
    font-size: 0.8125rem;
    margin-top: 0.5rem;
  }

  .legal-body {
    line-height: 1.7;
  }

  .legal-body h3 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 2rem 0 0.75rem;
    color: var(--color-brand-green, #009a44);
  }

  .legal-body h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem;
  }

  .legal-body p {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
  }

  .legal-intro {
    font-size: 1rem;
    font-weight: 500;
  }

  .legal-important {
    background: rgba(255, 103, 31, 0.08);
    border-left: 3px solid var(--color-brand-orange, #ff671f);
    padding: 0.75rem 1rem;
    border-radius: 0 6px 6px 0;
    font-weight: 500;
  }

  .legal-body ul {
    margin: 0 0 1rem;
    padding-left: 1.5rem;
  }

  .legal-body li {
    margin-bottom: 0.375rem;
    font-size: 0.9375rem;
  }

  .legal-contact {
    font-style: normal;
    background: var(--color-neutral-50, #fafafa);
    padding: 1rem 1.25rem;
    border-radius: 8px;
    margin-top: 0.5rem;
  }

  .legal-contact p {
    margin: 0 0 0.25rem;
  }

  .legal-contact a {
    color: var(--color-brand-green, #009a44);
  }
</style>
