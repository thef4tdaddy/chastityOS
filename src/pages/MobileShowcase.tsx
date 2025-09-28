/**
 * Mobile Showcase Page
 * Demonstrates mobile-first components and interactions
 */
import React, { useState } from "react";
import {
  MobileButton,
  MobileCard,
  MobileInput,
  TouchTarget,
  BottomSheet,
  PullToRefresh,
  SwipeableCard,
  VirtualList,
} from "../components/mobile";
import { useViewport, useHapticFeedback } from "../hooks/mobile";

const MobileShowcase: React.FC = () => {
  const { isMobile, isLandscape, safeAreaInsets } = useViewport();
  const { light, medium, heavy, success, error } = useHapticFeedback();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Sample data for virtual list
  const listItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}`,
  }));

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRefreshCount((prev) => prev + 1);
  };

  const swipeActions = [
    {
      id: "delete",
      label: "Delete",
      color: "red" as const,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      action: () => alert("Delete action"),
    },
    {
      id: "archive",
      label: "Archive",
      color: "blue" as const,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8l6 6 6-6"
          />
        </svg>
      ),
      action: () => alert("Archive action"),
    },
  ];

  return (
    <div className="min-h-screen bg-dark_purple text-white safe-area-inset-all">
      <div className="container-mobile py-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-fluid-2xl font-bold mb-2">Mobile Showcase</h1>
          <p className="text-fluid-base text-lavender_web">
            Demonstrating mobile-first components and interactions
          </p>
          <div className="mt-4 text-fluid-sm text-rose_quartz">
            <p>Viewport: {isMobile ? "Mobile" : "Desktop"}</p>
            <p>Orientation: {isLandscape ? "Landscape" : "Portrait"}</p>
            {isMobile && (
              <p>
                Safe Areas: T:{safeAreaInsets.top} B:{safeAreaInsets.bottom}
              </p>
            )}
          </div>
        </div>

        {/* Haptic Feedback Demo */}
        <MobileCard variant="glass" className="space-y-4">
          <h2 className="text-fluid-lg font-semibold">Haptic Feedback</h2>
          <div className="grid grid-cols-2 gap-3">
            <MobileButton size="sm" onClick={light}>
              Light
            </MobileButton>
            <MobileButton size="sm" onClick={medium} variant="secondary">
              Medium
            </MobileButton>
            <MobileButton size="sm" onClick={heavy} variant="outline">
              Heavy
            </MobileButton>
            <MobileButton size="sm" onClick={success} variant="primary">
              Success
            </MobileButton>
          </div>
        </MobileCard>

        {/* Button Variants */}
        <MobileCard variant="elevated" className="space-y-4">
          <h2 className="text-fluid-lg font-semibold">Button Variants</h2>
          <div className="space-y-3">
            <MobileButton fullWidth>Primary Button</MobileButton>
            <MobileButton variant="secondary" fullWidth>
              Secondary Button
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              Outline Button
            </MobileButton>
            <MobileButton variant="ghost" fullWidth>
              Ghost Button
            </MobileButton>
            <MobileButton variant="danger" fullWidth>
              Danger Button
            </MobileButton>
            <MobileButton loading fullWidth>
              Loading Button
            </MobileButton>
          </div>
        </MobileCard>

        {/* Input Examples */}
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

        {/* Touch Targets */}
        <MobileCard variant="outlined" className="space-y-4">
          <h2 className="text-fluid-lg font-semibold">Touch Targets</h2>
          <div className="grid grid-cols-3 gap-4">
            <TouchTarget
              onTap={() => alert("Tapped!")}
              className="bg-tekhelet/20 rounded-lg flex-col"
            >
              <span className="text-2xl">👆</span>
              <span className="text-xs">Tap</span>
            </TouchTarget>
            <TouchTarget
              onLongPress={() => alert("Long pressed!")}
              className="bg-tangerine/20 rounded-lg flex-col"
              hapticFeedback="medium"
            >
              <span className="text-2xl">👇</span>
              <span className="text-xs">Hold</span>
            </TouchTarget>
            <TouchTarget
              onTap={() => setShowBottomSheet(true)}
              className="bg-green-500/20 rounded-lg flex-col"
            >
              <span className="text-2xl">📋</span>
              <span className="text-xs">Sheet</span>
            </TouchTarget>
          </div>
        </MobileCard>

        {/* Swipeable Card Demo */}
        <div className="space-y-4">
          <h2 className="text-fluid-lg font-semibold">Swipeable Cards</h2>
          <SwipeableCard
            rightActions={swipeActions}
            className="bg-white/10 rounded-lg"
          >
            <div className="p-4">
              <h3 className="font-semibold">Swipe left to reveal actions</h3>
              <p className="text-sm text-gray-300 mt-1">
                Try swiping this card to the left to see action buttons
              </p>
            </div>
          </SwipeableCard>
        </div>

        {/* Pull to Refresh Demo */}
        <div className="space-y-4">
          <h2 className="text-fluid-lg font-semibold">Pull to Refresh</h2>
          <PullToRefresh
            onRefresh={handleRefresh}
            className="h-32 overflow-auto"
          >
            <div className="p-4 text-center">
              <p>Pull down to refresh</p>
              <p className="text-sm text-gray-400 mt-2">
                Refreshed {refreshCount} times
              </p>
            </div>
          </PullToRefresh>
        </div>

        {/* Virtual List Demo */}
        <div className="space-y-4">
          <h2 className="text-fluid-lg font-semibold">Virtual List</h2>
          <div className="h-64 border border-gray-600 rounded-lg">
            <VirtualList
              items={listItems}
              renderItem={(item) => (
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  <div className="w-8 h-8 bg-tekhelet rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">{item.id + 1}</span>
                  </div>
                </div>
              )}
              itemHeight={80}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Bottom Sheet Demo */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Mobile Bottom Sheet"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This is a mobile-optimized bottom sheet that slides up from the
            bottom. It supports swipe-to-close gestures and safe area handling.
          </p>
          <div className="space-y-2">
            <MobileButton fullWidth variant="primary">
              Primary Action
            </MobileButton>
            <MobileButton fullWidth variant="outline">
              Secondary Action
            </MobileButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default MobileShowcase;
