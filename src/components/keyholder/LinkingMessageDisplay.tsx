import React from "react";

interface LinkingMessageDisplayProps {
  message: string;
  messageType: "success" | "error" | "info";
  onClearMessage: () => void;
}

export const LinkingMessageDisplay: React.FC<LinkingMessageDisplayProps> = ({
  message,
  messageType,
  onClearMessage,
}) => {
  if (!message) return null;

  return (
    <div
      className={`p-3 rounded-lg border ${
        messageType === "success"
          ? "bg-green-900/50 border-green-500 text-green-300"
          : messageType === "error"
            ? "bg-red-900/50 border-red-500 text-red-300"
            : "bg-blue-900/50 border-blue-500 text-blue-300"
      }`}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm">{message}</p>
        <Button
          onClick={onClearMessage}
          className="text-current opacity-70 hover:opacity-100 ml-2"
        >
          ×
        </Button>
      </div>
    </div>
  );
};

export default LinkingMessageDisplay;
