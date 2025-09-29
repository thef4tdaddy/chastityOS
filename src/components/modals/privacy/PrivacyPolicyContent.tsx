import React from "react";
import {
  FaShieldAlt,
  FaLock,
  FaDatabase,
  FaUsers,
} from "../../../utils/iconImport";

// Introduction Section Component
const IntroductionSection: React.FC = () => (
  <section className="glass-card glass-hover">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30">
        <FaShieldAlt className="text-purple-300" />
      </div>
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Introduction
      </h3>
    </div>
    <p className="leading-relaxed">
      ChastityOS is committed to protecting your privacy and ensuring the
      security of your personal information. This privacy policy explains how we
      collect, use, and protect your data when you use our application.
    </p>
    <p className="leading-relaxed mt-3">
      We understand the sensitive nature of the data you entrust to us and have
      implemented strict security measures to protect your privacy at all times.
    </p>
  </section>
);

// Data Collection Section Component
const DataCollectionSection: React.FC = () => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaDatabase className="text-nightly-spring-green" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Data We Collect
      </h3>
    </div>
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-nightly-honeydew mb-2">
          Account Information
        </h4>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Email address for account authentication</li>
          <li>Display name and profile information you provide</li>
          <li>Account preferences and settings</li>
        </ul>
      </div>
      <div>
        <h4 className="font-medium text-nightly-honeydew mb-2">Usage Data</h4>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Chastity session data (duration, start/end times)</li>
          <li>Events and logs you create</li>
          <li>Tasks and goals you set</li>
          <li>Relationship data (with consent)</li>
          <li>Analytics data to improve the service</li>
        </ul>
      </div>
      <div>
        <h4 className="font-medium text-nightly-honeydew mb-2">
          Technical Data
        </h4>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Device information and browser type</li>
          <li>IP address and location data (anonymized)</li>
          <li>Performance and error logs</li>
        </ul>
      </div>
    </div>
  </section>
);

// Data Usage Section Component
const DataUsageSection: React.FC = () => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaLock className="text-nightly-spring-green" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        How We Use Your Data
      </h3>
    </div>
    <div className="space-y-3">
      <p className="leading-relaxed">
        We use your data exclusively to provide and improve ChastityOS services:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Maintain your chastity tracking and session data</li>
        <li>Enable communication with keyholders (when authorized)</li>
        <li>Provide personalized achievements and goals</li>
        <li>Send important notifications about your sessions</li>
        <li>Improve app performance and user experience</li>
        <li>Provide customer support when requested</li>
      </ul>
    </div>
  </section>
);

// Data Security Section Component
const DataSecuritySection: React.FC = () => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaLock className="text-nightly-coral" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Data Security
      </h3>
    </div>
    <div className="space-y-3">
      <p className="leading-relaxed">
        We implement industry-standard security measures to protect your data:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>
          <strong>Encryption:</strong> All data is encrypted in transit and at
          rest
        </li>
        <li>
          <strong>Authentication:</strong> Secure login with optional two-factor
          authentication
        </li>
        <li>
          <strong>Access Control:</strong> Strict access controls limit who can
          view your data
        </li>
        <li>
          <strong>Regular Audits:</strong> We regularly review and update our
          security practices
        </li>
        <li>
          <strong>Local Storage:</strong> Some data is stored locally on your
          device for offline access
        </li>
      </ul>
    </div>
  </section>
);

// Data Sharing Section Component
const DataSharingSection: React.FC = () => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaUsers className="text-nightly-spring-green" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Data Sharing
      </h3>
    </div>
    <div className="space-y-3">
      <p className="leading-relaxed">
        <strong>
          We do not sell, trade, or rent your personal information to third
          parties.
        </strong>
      </p>
      <p className="leading-relaxed">
        We may share limited data only in these circumstances:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>
          With your explicit consent (e.g., public profiles you choose to share)
        </li>
        <li>With keyholders you authorize in relationship settings</li>
        <li>To comply with legal obligations or court orders</li>
        <li>To protect the rights and safety of our users</li>
        <li>
          With service providers who help us operate the app (under strict
          confidentiality agreements)
        </li>
      </ul>
    </div>
  </section>
);

// Your Rights Section Component
const YourRightsSection: React.FC = () => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaShieldAlt className="text-nightly-lavender-floral" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Your Rights
      </h3>
    </div>
    <div className="space-y-3">
      <p className="leading-relaxed">
        You have the following rights regarding your personal data:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>
          <strong>Access:</strong> Request a copy of your personal data
        </li>
        <li>
          <strong>Correction:</strong> Update or correct your information
        </li>
        <li>
          <strong>Deletion:</strong> Request deletion of your account and data
        </li>
        <li>
          <strong>Portability:</strong> Export your data in a machine-readable
          format
        </li>
        <li>
          <strong>Restriction:</strong> Limit how we process your data
        </li>
        <li>
          <strong>Objection:</strong> Object to processing for marketing
          purposes
        </li>
      </ul>
      <p className="leading-relaxed">
        To exercise these rights, contact us at privacy@chastityos.com.
      </p>
    </div>
  </section>
);

// Contact Section Component
const ContactSection: React.FC = () => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaDatabase className="text-nightly-lavender-floral" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Contact Us
      </h3>
    </div>
    <p className="leading-relaxed">
      If you have questions about this privacy policy or how we handle your
      data, please contact our privacy team:
    </p>
    <div className="mt-3 bg-white/5 rounded-lg p-4">
      <p>
        <strong>Email:</strong> privacy@chastityos.com
      </p>
      <p>
        <strong>Response Time:</strong> Within 48 hours
      </p>
      <p>
        <strong>Data Protection Officer:</strong> Available upon request
      </p>
    </div>
  </section>
);

// Changes to Policy Section Component
const ChangesToPolicySection: React.FC = () => (
  <section className="border-t border-white/10 pt-6">
    <h3 className="text-lg font-semibold text-nightly-honeydew mb-3">
      Changes to This Policy
    </h3>
    <p className="leading-relaxed">
      We may update this privacy policy from time to time. We will notify you of
      any changes by posting the new privacy policy on this page and updating
      the "Last updated" date. We encourage you to review this privacy policy
      periodically for any changes.
    </p>
  </section>
);

// Main Privacy Policy Content Component
export const PrivacyPolicyContent: React.FC = () => {
  return (
    <>
      <IntroductionSection />
      <DataCollectionSection />
      <DataUsageSection />
      <DataSecuritySection />
      <DataSharingSection />
      <YourRightsSection />
      <ContactSection />
      <ChangesToPolicySection />
    </>
  );
};
