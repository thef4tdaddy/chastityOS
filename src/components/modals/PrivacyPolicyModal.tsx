import React from "react";
import { FaTimes, FaShield, FaLock, FaDatabase, FaUsers } from "react-icons/fa";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg max-w-4xl w-full max-h-[90vh] rounded-lg border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FaShield className="text-nightly-aquamarine" />
            <h2 className="text-xl font-bold text-nightly-honeydew">
              Privacy Policy
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-nightly-celadon hover:text-nightly-honeydew"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 text-nightly-celadon">
          {/* Last Updated */}
          <div className="text-sm text-nightly-celadon/70">
            Last updated: {new Date().toLocaleDateString()}
          </div>

          {/* Introduction */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaShield className="text-nightly-lavender-floral" />
              <h3 className="text-lg font-semibold text-nightly-honeydew">
                Introduction
              </h3>
            </div>
            <p className="leading-relaxed">
              ChastityOS is committed to protecting your privacy and ensuring
              the security of your personal information. This privacy policy
              explains how we collect, use, and protect your data when you use
              our application.
            </p>
            <p className="leading-relaxed mt-3">
              We understand the sensitive nature of the data you entrust to us
              and have implemented strict security measures to protect your
              privacy at all times.
            </p>
          </section>

          {/* Data Collection */}
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
                <h4 className="font-medium text-nightly-honeydew mb-2">
                  Usage Data
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Chastity session data (duration, start/end times)</li>
                  <li>Task completion records</li>
                  <li>Event logs you create</li>
                  <li>Goal tracking information</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-nightly-honeydew mb-2">
                  Technical Data
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device information and browser type</li>
                  <li>IP address for security purposes</li>
                  <li>Usage analytics to improve our service</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaLock className="text-nightly-aquamarine" />
              <h3 className="text-lg font-semibold text-nightly-honeydew">
                How We Use Your Data
              </h3>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain the ChastityOS service</li>
              <li>To personalize your experience and track your progress</li>
              <li>
                To communicate with you about your account and service updates
              </li>
              <li>To improve our application and develop new features</li>
              <li>To ensure the security and integrity of our service</li>
              <li>To comply with legal obligations when required</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaShield className="text-nightly-lavender-floral" />
              <h3 className="text-lg font-semibold text-nightly-honeydew">
                Data Security
              </h3>
            </div>
            <div className="space-y-3">
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your
                data:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>Encryption:</strong> All data is encrypted in transit
                  and at rest
                </li>
                <li>
                  <strong>Authentication:</strong> Secure login with optional
                  two-factor authentication
                </li>
                <li>
                  <strong>Access Control:</strong> Strict access controls limit
                  who can view your data
                </li>
                <li>
                  <strong>Regular Audits:</strong> We regularly review and
                  update our security practices
                </li>
                <li>
                  <strong>Local Storage:</strong> Some data is stored locally on
                  your device for offline access
                </li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
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
                  We do not sell, trade, or rent your personal information to
                  third parties.
                </strong>
              </p>
              <p className="leading-relaxed">
                We may share limited data only in these circumstances:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  With your explicit consent (e.g., public profiles you choose
                  to share)
                </li>
                <li>
                  With keyholder accounts you explicitly link to your account
                </li>
                <li>When required by law or to protect our legal rights</li>
                <li>
                  With service providers who help us operate our application
                  (under strict confidentiality agreements)
                </li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaShield className="text-nightly-aquamarine" />
              <h3 className="text-lg font-semibold text-nightly-honeydew">
                Your Rights
              </h3>
            </div>
            <p className="leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                data
              </li>
              <li>
                <strong>Export:</strong> Download your data in a portable format
              </li>
              <li>
                <strong>Opt-out:</strong> Withdraw consent for data processing
              </li>
              <li>
                <strong>Privacy Settings:</strong> Control what information is
                shared
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaDatabase className="text-nightly-lavender-floral" />
              <h3 className="text-lg font-semibold text-nightly-honeydew">
                Contact Us
              </h3>
            </div>
            <p className="leading-relaxed">
              If you have questions about this privacy policy or how we handle
              your data, please contact our privacy team:
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

          {/* Changes to Policy */}
          <section className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-nightly-honeydew mb-3">
              Changes to This Policy
            </h3>
            <p className="leading-relaxed">
              We may update this privacy policy from time to time. We will
              notify you of any changes by posting the new privacy policy on
              this page and updating the "Last updated" date. We encourage you
              to review this privacy policy periodically for any changes.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-3 rounded-lg font-medium transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
