import React from 'react';
import RulesEditor from '../components/keyholder/RulesEditor';

const KeyholderRulesPage = ({ rulesText, setRulesText, onBack }) => {
  return (
    <div className="p-4 space-y-4">
      <RulesEditor currentRulesText={rulesText} onSaveRules={setRulesText} />
      <button
        type="button"
        onClick={onBack}
        className="button-blue !text-blue-300"
      >
        Back to Keyholder
      </button>
    </div>
  );
};

export default KeyholderRulesPage;
