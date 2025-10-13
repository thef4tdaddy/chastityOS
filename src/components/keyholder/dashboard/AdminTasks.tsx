import React from "react";
import { AdminRelationship } from "@/types/account-linking";
import { Button } from "@/components/ui";

export const AdminTasks = React.memo<{
  relationship: AdminRelationship;
  isSessionActive: boolean;
}>(({ relationship, isSessionActive }) => (
  <div className="space-y-3 sm:space-y-4">
    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
      <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-3">
        Task Management
      </h4>
      {isSessionActive ? (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-nightly-celadon break-words">
            Manage tasks for {relationship.wearerId}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              View All Tasks
            </Button>
            <Button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Create New Task
            </Button>
            <Button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Review Submissions
            </Button>
            <Button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Set Rewards/Punishments
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-nightly-celadon">
          Start an admin session to manage tasks.
        </p>
      )}
    </div>
  </div>
));
AdminTasks.displayName = "AdminTasks";
