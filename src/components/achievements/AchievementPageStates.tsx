import React from "react";
import { motion } from "framer-motion";
import { FaTrophy } from "../../utils/iconImport";
import {
  skeletonPulseVariants,
  getAccessibleVariants,
} from "../../utils/animations";

export const AchievementLoadingState: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Stats Header Skeleton */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
          <motion.div
            className="h-8 w-48 bg-white/20 rounded"
            variants={getAccessibleVariants(skeletonPulseVariants)}
            animate="animate"
          />
          <div className="flex gap-2 sm:gap-4">
            <motion.div
              className="h-5 w-24 bg-white/20 rounded"
              variants={getAccessibleVariants(skeletonPulseVariants)}
              animate="animate"
            />
            <motion.div
              className="h-5 w-24 bg-white/20 rounded"
              variants={getAccessibleVariants(skeletonPulseVariants)}
              animate="animate"
            />
            <motion.div
              className="h-5 w-24 bg-white/20 rounded"
              variants={getAccessibleVariants(skeletonPulseVariants)}
              animate="animate"
            />
          </div>
        </div>
        <motion.div
          className="w-full bg-gray-700 rounded-full h-2"
          variants={getAccessibleVariants(skeletonPulseVariants)}
          animate="animate"
        />
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <motion.div
            className="h-10 flex-1 bg-white/20 rounded"
            variants={getAccessibleVariants(skeletonPulseVariants)}
            animate="animate"
          />
          <motion.div
            className="h-10 w-full sm:w-40 bg-white/20 rounded"
            variants={getAccessibleVariants(skeletonPulseVariants)}
            animate="animate"
          />
          <motion.div
            className="h-10 w-full sm:w-40 bg-white/20 rounded"
            variants={getAccessibleVariants(skeletonPulseVariants)}
            animate="animate"
          />
        </div>
      </div>

      {/* Achievement Cards Skeleton */}
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          <motion.div
            className="h-8 w-48 bg-white/20 rounded"
            variants={getAccessibleVariants(skeletonPulseVariants)}
            animate="animate"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                className="bg-white/10 p-3 sm:p-4 rounded-lg border-2 border-gray-600"
                variants={getAccessibleVariants(skeletonPulseVariants)}
                animate="animate"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-white/20 rounded w-3/4" />
                    <div className="h-4 bg-white/20 rounded w-full" />
                    <div className="h-4 bg-white/20 rounded w-5/6" />
                    <div className="flex gap-2 mt-3">
                      <div className="h-6 w-16 bg-white/20 rounded" />
                      <div className="h-6 w-16 bg-white/20 rounded" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const AchievementSignInPrompt: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <FaTrophy className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
        <div className="text-nightly-celadon">
          Please sign in to view achievements
        </div>
      </div>
    </div>
  </div>
);
