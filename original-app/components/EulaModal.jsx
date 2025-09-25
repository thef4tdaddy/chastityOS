// src/components/EulaModal.jsx
import React from "react";
import { FaTimes } from "react-icons/fa";

const EulaModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl text-gray-200 border-2 border-purple-700 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
          aria-label="Close modal"
        >
          {/* FIX: Reduced the icon size for a cleaner look */}
          <FaTimes size={22} />
        </button>
        <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">
          Terms of Use & Disclaimer
        </h2>

        <div className="overflow-y-auto pr-4 text-sm text-gray-300 leading-relaxed">
          <p className="mb-4 font-semibold text-purple-200">
            Welcome to ChastityOS. By using this application, you acknowledge,
            understand, and agree to the following terms:
          </p>

          <h3 className="font-bold text-purple-300 mt-4 mb-2 text-md">
            1. Assumption of Risk
          </h3>
          <p className="mb-3">
            This application is intended for entertainment purposes for
            consenting adults. The activities tracked and encouraged by this
            app, including but not limited to chastity, BDSM, and related
            power-exchange dynamics, carry inherent physical and psychological
            risks. You and any participating partners voluntarily assume all
            risks associated with the use of this application. The creators and
            developers of ChastityOS are not responsible for any physical,
            psychological, or emotional harm, or any other damages that may
            result from your use of this app.
          </p>

          <h3 className="font-bold text-purple-300 mt-4 mb-2 text-md">
            2. Not Medical or Professional Advice
          </h3>
          <p className="mb-3">
            ChastityOS is not a medical device or a substitute for professional
            medical, legal, or psychological advice. Information provided by the
            application should not be interpreted as a recommendation for any
            specific treatment plan, product, or course of action. You should
            always seek the advice of a qualified health provider with any
            questions you may have regarding a medical condition. Do not
            disregard professional medical advice or delay in seeking it because
            of something you have read or tracked on this application.
          </p>

          <h3 className="font-bold text-purple-300 mt-4 mb-2 text-md">
            3. User Responsibility & Consent
          </h3>
          <p className="mb-3">
            You are solely responsible for your actions and the data you input.
            All activities should be performed with the full, informed, and
            enthusiastic consent (FRIES) of all parties involved. It is your
            responsibility to communicate boundaries, use safe words, and ensure
            the well-being of all participants. This application is a tool and
            does not replace the need for clear communication and responsible
            play. By using features involving other users (e.g., a keyholder),
            you confirm that you have obtained their explicit consent to
            participate.
          </p>

          <h3 className="font-bold text-purple-300 mt-4 mb-2 text-md">
            4. Data and Security
          </h3>
          <p className="mb-3">
            While we strive to protect your data, we cannot guarantee its
            absolute security. You acknowledge that you are providing personal
            and sensitive information at your own risk. Features like "Hardcore
            Mode" and self-locking are designed to be difficult to bypass; you
            assume full responsibility for any consequences of using these
            features, including the potential for being unable to access your
            device or combination if you lose your backup code.
          </p>

          <h3 className="font-bold text-purple-300 mt-4 mb-2 text-md">
            5. Limitation of Liability
          </h3>
          <p className="mb-3">
            In no event shall the creators or developers of ChastityOS be liable
            for any direct, indirect, incidental, special, consequential, or
            exemplary damages resulting from the use or inability to use this
            application. Your sole and exclusive remedy for any dispute with the
            creators is to discontinue your use of the app.
          </p>

          <p className="mt-6 font-bold text-center text-purple-200">
            By continuing to use ChastityOS, you are affirming that you have
            read, understood, and agreed to these terms.
          </p>
        </div>
        {/* FIX: The redundant close button at the bottom has been removed */}
      </div>
    </div>
  );
};

// A simple fade-in animation
const styles = `
@keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
    animation: fade-in 0.2s ease-out forwards;
}
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default EulaModal;
