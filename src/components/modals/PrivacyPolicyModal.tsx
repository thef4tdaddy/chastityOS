import React from "react";
import { FaShieldAlt } from "../../utils/iconImport";
import { Button, Card, Modal } from "@/components/ui";
import { PrivacyPolicyContent } from "./privacy/PrivacyPolicyContent";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      icon={
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
          <FaShieldAlt className="text-blue-300 text-xl" />
        </div>
      }
      size="lg"
      footer={
        <Button
          variant="primary"
          onClick={onClose}
          className="w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-3"
        >
          I Understand
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Last Updated */}
        <Card
          variant="glass"
          padding="sm"
          className="bg-blue-500/10 border-blue-400/20 text-center"
        >
          <span className="text-sm text-blue-200">
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </Card>

        <PrivacyPolicyContent />
      </div>
    </Modal>
  );
};

export default PrivacyPolicyModal;
