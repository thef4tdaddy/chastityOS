import React, { useState } from 'react';
import {
  FaUserShield,
  FaLink,
  FaUsers,
  FaQrcode,
  FaClipboard,
} from 'react-icons/fa';

// Future Account Linking Preview Component
export const AccountLinkingPreview: React.FC = () => {
  const [showLinkingDemo, setShowLinkingDemo] = useState(false);
  const [linkCode] = useState('CHY-X9K2-P7M4'); // Demo code

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <FaUserShield className="text-nightly-lavender-floral" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">Account Linking (Coming Soon)</h2>
        <span className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded">
          PREVIEW
        </span>
      </div>

      <p className="text-nightly-celadon mb-4">
        The future keyholder system will use secure account linking instead of shared passwords.
        This provides better security and proper multi-user support.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
              <FaLink className="text-nightly-aquamarine" />
              For Submissives
            </h3>
            <ul className="text-sm text-nightly-celadon space-y-1">
              <li>• Generate secure link codes</li>
              <li>• Share privately with keyholder</li>
              <li>• Maintain ultimate control</li>
              <li>• Disconnect anytime</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
              <FaUsers className="text-nightly-lavender-floral" />
              For Keyholders
            </h3>
            <ul className="text-sm text-nightly-celadon space-y-1">
              <li>• Full admin dashboard access</li>
              <li>• Manage multiple submissives</li>
              <li>• Real-time control & monitoring</li>
              <li>• Audit trail of all actions</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setShowLinkingDemo(!showLinkingDemo)}
          className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          {showLinkingDemo ? 'Hide Demo' : 'Preview Linking Process'}
        </button>

        {showLinkingDemo && (
          <div className="bg-white/5 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-nightly-honeydew">Demo: Link Code Generation</h4>

            <div className="bg-black/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-nightly-celadon text-sm">Your Link Code:</span>
                <span className="text-xs text-nightly-celadon">Expires in 23h 45m</span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <code className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-3 py-2 rounded font-mono text-lg">
                  {linkCode}
                </code>
                <button className="text-nightly-aquamarine hover:text-nightly-spring-green">
                  <FaClipboard />
                </button>
              </div>

              <div className="flex gap-2">
                <button className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-3 py-1 rounded text-sm flex items-center gap-2">
                  <FaQrcode />
                  QR Code
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-3 py-1 rounded text-sm">
                  Share URL
                </button>
              </div>
            </div>

            <div className="text-sm text-nightly-celadon">
              <p className="mb-2">
                <strong>Secure Sharing:</strong> Share this code privately with your keyholder via text,
                voice, QR code, or encrypted email.
              </p>
              <p>
                <strong>One-Time Use:</strong> Code expires in 24 hours or after first use.
                You can disconnect the keyholder anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};