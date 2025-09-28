import React from "react";
import { MobileCard, MobileInput } from "../../components/mobile";

export const InputExamplesDemo: React.FC = () => {
  return (
    <MobileCard variant="default" className="space-y-4">
      <h2 className="text-fluid-lg font-semibold">Mobile Inputs</h2>
      <div className="space-y-4">
        <MobileInput
          label="Email"
          type="email"
          placeholder="Enter your email"
          leftIcon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
          }
        />
        <MobileInput
          label="Password"
          type="password"
          placeholder="Enter password"
          variant="filled"
        />
        <MobileInput
          label="Phone"
          type="tel"
          placeholder="(555) 123-4567"
          variant="borderless"
        />
      </div>
    </MobileCard>
  );
};
