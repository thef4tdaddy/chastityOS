import React, { useState, useEffect } from "react";

const RulesEditor = ({ currentRulesText = "", onSaveRules }) => {
  const [text, setText] = useState(currentRulesText);

  useEffect(() => {
    setText(currentRulesText || "");
  }, [currentRulesText]);

  const handleSave = () => {
    if (onSaveRules) onSaveRules(text);
  };

  return (
    <div className="p-4 bg-gray-800 border border-blue-700 rounded-lg space-y-3">
      <h3 className="title-blue !text-blue-300">Manage Rules</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter rules in Markdown or one rule per line"
        rows={8}
        className="w-full p-2 bg-gray-900 rounded-md border border-blue-600 text-sm"
      />
      <button onClick={handleSave} className="button-blue !text-blue-300">
        Save Rules
      </button>
    </div>
  );
};

export default RulesEditor;
