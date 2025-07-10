import React from 'react';
import { marked } from 'marked';

const RulesPage = ({ rulesText = '', savedSubmissivesName }) => {
  const html = marked.parse(rulesText || '');
  const title = savedSubmissivesName
    ? `${savedSubmissivesName}'s Rules`
    : 'Rules';

  return (
    <div className="p-4 text-left space-y-4">
      <h3 className="subpage-title mb-4">{title}</h3>
      {rulesText ? (
        <div className="prose prose-sm sm:prose-base max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-purple-200">No rules have been set.</p>
      )}
    </div>
  );
};

export default RulesPage;
