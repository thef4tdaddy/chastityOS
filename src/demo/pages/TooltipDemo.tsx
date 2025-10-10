/**
 * Tooltip Component Demo
 * Showcases different tooltip placements and use cases
 */
import React from "react";
import { Tooltip, Button, IconButton, Card } from "@/components/ui";
import { FaInfo, FaQuestion, FaCog } from "react-icons/fa";

export const TooltipDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-nightly-honeydew mb-2">
          Tooltip Component
        </h1>
        <p className="text-nightly-celadon">
          Interactive tooltips that provide contextual help on hover and focus
        </p>
      </div>

      {/* Placement Options */}
      <Card variant="glass">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Placement Options
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tooltip content="This tooltip appears on top" placement="top">
            <Button variant="primary" fullWidth>
              Top
            </Button>
          </Tooltip>
          <Tooltip
            content="This tooltip appears on the right"
            placement="right"
          >
            <Button variant="primary" fullWidth>
              Right
            </Button>
          </Tooltip>
          <Tooltip
            content="This tooltip appears on the bottom"
            placement="bottom"
          >
            <Button variant="primary" fullWidth>
              Bottom
            </Button>
          </Tooltip>
          <Tooltip content="This tooltip appears on the left" placement="left">
            <Button variant="primary" fullWidth>
              Left
            </Button>
          </Tooltip>
        </div>
      </Card>

      {/* Icon Buttons */}
      <Card variant="glass">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Icon Buttons with Tooltips
        </h2>
        <div className="flex gap-4 items-center">
          <Tooltip content="Get help and information">
            <IconButton
              icon={<FaInfo />}
              aria-label="Information"
              variant="primary"
            />
          </Tooltip>
          <Tooltip content="Frequently asked questions">
            <IconButton
              icon={<FaQuestion />}
              aria-label="Help"
              variant="secondary"
            />
          </Tooltip>
          <Tooltip content="Open settings menu">
            <IconButton
              icon={<FaCog />}
              aria-label="Settings"
              variant="ghost"
            />
          </Tooltip>
        </div>
      </Card>

      {/* Different Delays */}
      <Card variant="glass">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Custom Delays
        </h2>
        <div className="flex gap-4 flex-wrap">
          <Tooltip content="Instant tooltip (0ms delay)" delay={0}>
            <Button variant="outline">No Delay</Button>
          </Tooltip>
          <Tooltip content="Default delay (300ms)">
            <Button variant="outline">Default</Button>
          </Tooltip>
          <Tooltip content="Slow tooltip (1000ms delay)" delay={1000}>
            <Button variant="outline">Slow (1s)</Button>
          </Tooltip>
        </div>
      </Card>

      {/* Complex Content */}
      <Card variant="glass">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Complex Tooltip Content
        </h2>
        <div className="flex gap-4 items-center flex-wrap">
          <Tooltip
            content={
              <div>
                <strong>Pro Tip:</strong>
                <br />
                You can include formatted text in tooltips!
              </div>
            }
          >
            <Button variant="primary">Rich Content</Button>
          </Tooltip>
          <Tooltip
            content={
              <ul className="text-xs space-y-1">
                <li>✓ Backup your data</li>
                <li>✓ Sync across devices</li>
                <li>✓ Never lose progress</li>
              </ul>
            }
          >
            <Button variant="secondary">Feature List</Button>
          </Tooltip>
        </div>
      </Card>

      {/* Disabled State */}
      <Card variant="glass">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Disabled Tooltips
        </h2>
        <div className="flex gap-4">
          <Tooltip content="This tooltip is enabled">
            <Button variant="primary">Enabled Tooltip</Button>
          </Tooltip>
          <Tooltip content="This won't show" disabled>
            <Button variant="secondary">Disabled Tooltip</Button>
          </Tooltip>
        </div>
      </Card>

      {/* Accessibility */}
      <Card variant="glass">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Keyboard Accessibility
        </h2>
        <p className="text-nightly-celadon text-sm mb-4">
          Tooltips appear on both hover and focus. Try tabbing through these
          buttons:
        </p>
        <div className="flex gap-4 flex-wrap">
          <Tooltip content="Tab to focus me!">
            <Button variant="outline">Button 1</Button>
          </Tooltip>
          <Tooltip content="I'm keyboard accessible too">
            <Button variant="outline">Button 2</Button>
          </Tooltip>
          <Tooltip content="So am I!">
            <Button variant="outline">Button 3</Button>
          </Tooltip>
        </div>
      </Card>

      {/* Auto-adjustment Demo */}
      <Card variant="glass">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Auto Position Adjustment
        </h2>
        <p className="text-nightly-celadon text-sm mb-4">
          Tooltips automatically adjust their position to stay within the
          viewport. Try hovering over these edge buttons:
        </p>
        <div className="flex justify-between">
          <Tooltip
            content="This tooltip adjusts to stay visible"
            placement="left"
          >
            <Button variant="primary" size="sm">
              Left Edge
            </Button>
          </Tooltip>
          <Tooltip
            content="This tooltip adjusts to stay visible"
            placement="right"
          >
            <Button variant="primary" size="sm">
              Right Edge
            </Button>
          </Tooltip>
        </div>
      </Card>
    </div>
  );
};

export default TooltipDemo;
