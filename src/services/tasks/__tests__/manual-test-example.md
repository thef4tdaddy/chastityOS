# Manual Testing Guide for Recurring Tasks

## Test Scenarios

### 1. Create Daily Recurring Task

**Steps:**

1. Navigate to Keyholder dashboard
2. Click "Create New Task"
3. Enter task title: "Daily Exercise"
4. Check "Make this a recurring task"
5. Select frequency: "Daily"
6. Set interval: 1
7. Click "Save Recurring Settings"
8. Click "Create Task"

**Expected Result:**

- Task created with isRecurring=true
- recurringConfig.frequency="daily"
- recurringConfig.interval=1

### 2. Approve Recurring Task → Creates Next Instance

**Steps:**

1. Have submissive submit the "Daily Exercise" task
2. As keyholder, approve the task
3. Check task list

**Expected Result:**

- Original task status changes to "approved"
- New task automatically created with:
  - Same title: "Daily Exercise"
  - Status: "pending"
  - dueDate: Tomorrow's date
  - instanceNumber: 2
  - recurringSeriesId: Same as parent
  - parentTaskId: ID of approved task

### 3. Weekly Recurring Task (Mon/Wed/Fri)

**Steps:**

1. Create task with recurring settings:
   - Frequency: "Weekly"
   - Days: Monday, Wednesday, Friday
2. Approve task on Monday

**Expected Result:**

- Next instance created for Wednesday
- If approved on Wednesday, next creates for Friday
- If approved on Friday, next creates for Monday

### 4. Monthly Recurring Task (15th of month)

**Steps:**

1. Create task with recurring settings:
   - Frequency: "Monthly"
   - Day of month: 15
2. Approve task on January 10th

**Expected Result:**

- Next instance created for January 15th
- If approved on January 20th, next creates for February 15th

### 5. View Recurring Series

**Steps:**

1. Create and approve a recurring task 3 times
2. Use RecurringTaskService.getRecurringSeries(seriesId)

**Expected Result:**

- Returns array with 3 task instances
- All have same recurringSeriesId
- Instance numbers: 1, 2, 3
- Each has parentTaskId linking to previous

### 6. Stop Recurring Series

**Steps:**

1. Create recurring task with multiple future instances
2. Call RecurringTaskService.stopRecurringSeries(seriesId)

**Expected Result:**

- All pending instances status changes to "cancelled"
- Approved/completed instances remain unchanged

### 7. UI Components

**RecurringTaskBadge:**

```tsx
// Should display:
// 🔄 Daily #2
// 🔄 Weekly #5
// 🔄 Monthly #1
```

**RecurringTaskForm:**

- All frequency options selectable
- Weekly shows day checkboxes
- Monthly shows day input (1-31)
- Custom shows interval input
- Form validation prevents empty selections

## Data Verification

After each test, verify in database:

```javascript
// Check task structure
const task = await taskDBService.findById(taskId);
console.log({
  isRecurring: task.isRecurring,
  recurringConfig: task.recurringConfig,
  recurringSeriesId: task.recurringSeriesId,
});

// Check next instance was created
const allTasks = await taskDBService.getAll();
const nextInstance = allTasks.find(
  (t) => t.recurringConfig?.parentTaskId === taskId,
);
console.log("Next instance:", nextInstance);
```

## Edge Cases to Test

1. **Approve recurring task when offline**
   - Should queue next instance creation
   - Should sync when back online

2. **Month boundary (Jan 31 → Feb 1)**
   - Daily task approved on Jan 31
   - Next instance should be Feb 1

3. **Invalid month day (Feb 30)**
   - Monthly task set for day 30
   - Should handle February gracefully

4. **Leap year**
   - Monthly task for Feb 29
   - Should work in leap years, skip in non-leap

5. **Week wraparound**
   - Weekly task for Sunday
   - Approved on Monday
   - Should create for next Sunday (6 days later)

## Troubleshooting

### Next instance not created

- Check task has isRecurring=true
- Check recurringConfig is set
- Check browser console for errors
- Verify useApproveTask hook is being used

### Wrong next due date

- Verify frequency setting
- Check daysOfWeek array (0=Sun, 6=Sat)
- Check dayOfMonth value (1-31)
- Review RecurringTaskService.calculateNextDueDate logic

### Series ID not linking

- Verify recurringSeriesId is preserved
- Check parentTaskId is set correctly
- Ensure createNextInstance is completing successfully
