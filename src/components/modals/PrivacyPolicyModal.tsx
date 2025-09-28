import React from "react";
import { FaTimes, FaShieldAlt } from "../../utils/iconImport";
import { PrivacyPolicyContent } from "./privacy/PrivacyPolicyContent";

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
    <div className="glass-modal fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="glass-modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up">
        {/* Enhanced Header with Glass Effect */}
        <div className="glass-card-primary border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
                <FaShieldAlt className="text-blue-300 text-xl" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Privacy Policy
              </h2>
            </div>
            <button
              onClick={onClose}
              className="glass-button p-3 hover:bg-red-500/20 text-gray-300 hover:text-white transition-all duration-300"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Enhanced Content with Glass Styling */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Last Updated */}
          <div className="glass-card bg-blue-500/10 border-blue-400/20 p-3 text-center">
            <span className="text-sm text-blue-200">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>

          <PrivacyPolicyContent />
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
