# Task UI Animations Guide

This document describes the animations and visual polish added to the Task UI in ChastityOS.

## Overview

All animations are implemented using Framer Motion and CSS, with full support for `prefers-reduced-motion` accessibility. Animations enhance the user experience without being distracting or blocking interactions.

## Animation Library

### Location
- **Utilities**: `src/utils/animations.ts`
- **CSS Keyframes**: `src/index.css`

### Key Features
- **Duration**: 150-300ms for most transitions (fast, normal, slow)
- **Easing**: Custom cubic-bezier curves and spring physics
- **Accessibility**: Full `prefers-reduced-motion` support
- **Performance**: Hardware-accelerated transforms, 60fps target

## Component Animations

### 1. Task Cards (`TaskItem.tsx`)

#### Hover Effects
- **Scale**: 1.02x on hover (pending tasks only)
- **Shadow**: Elevated shadow on hover
- **Transition**: 150ms ease-out

```typescript
whileHover={task.status === "pending" ? "hover" : undefined}
```

#### Enter/Exit Animations
- **Enter**: Fade in + slide up from 20px
- **Exit**: Fade out + slide up
- **Duration**: 300ms

#### Status Change Animations
- **Approval**: Celebration emoji overlay (🎉) with bounce animation
- **Rejection**: Shake animation available
- **Status Badge**: Scale-in with spring physics

#### Implementation
```tsx
<motion.div
  variants={taskCardVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  whileHover="hover"
/>
```

### 2. Buttons

#### Hover State
- **Scale**: 1.05x
- **Duration**: 150ms
- **Cursor**: Changes to pointer

#### Active/Pressed State
- **Scale**: 0.95x (tap feedback)
- **Duration**: 75ms

#### Loading State
- **Spinner**: Rotating border animation (360°/1s)
- **Text**: Changes to "Submitting..." or "Processing..."

#### Implementation
```tsx
<motion.button
  variants={buttonVariants}
  whileHover="hover"
  whileTap="tap"
>
  {isLoading ? (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity }}
    />
  ) : "Submit"}
</motion.button>
```

### 3. Evidence Upload (`TaskEvidenceUpload.tsx`)

#### Drop Zone
- **Idle**: Neutral border color
- **Hover**: Border brightens, scale 1.01x
- **Drag Over**: Border highlights, background tints, scale 1.02x
- **Icon**: Pulsing animation on drag over

#### File Preview
- **Enter**: Fade in + scale from 0.8x
- **Exit**: Fade out + scale to 0.8x
- **Duration**: 300ms

#### Upload States
- **Uploading**: Spinner rotation
- **Success**: Green checkmark with scale-in animation
- **Error**: Red X with shake animation

#### Implementation
```tsx
<motion.div
  variants={uploadZoneVariants}
  animate={isDragging ? "dragOver" : "idle"}
  whileHover="hover"
/>
```

### 4. Toast Notifications (`NotificationToast.tsx`)

#### Slide In/Out
- **Enter**: Slide up + fade in + scale from 0.3x
- **Exit**: Fade out + scale to 0.5x
- **Duration**: 300ms with spring physics

#### Icon Animations
- **Success**: Rotate from -180° + scale in
- **Error**: Shake side-to-side + scale in
- **Warning**: Rotate from 180° + scale in
- **Info**: Scale in

#### Progress Bar
- **Auto-dismiss**: Linear progress bar at bottom
- **Color**: Gradient (blue to purple)
- **Duration**: Matches toast duration
- **Updates**: Every 50ms for smooth animation

#### Implementation
```tsx
<motion.div
  variants={toastVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  <NotificationIcon /> {/* Animated icon */}
  <ProgressBar progress={progress} /> {/* Auto-dismiss bar */}
</motion.div>
```

### 5. Task Lists (`TasksPage.tsx`, `TaskManagement.tsx`)

#### Stagger Animation
- **Container**: Stagger children by 100ms
- **Items**: Slide in from left
- **Delay**: 100ms between each item

#### Tab Navigation
- **Hover**: Scale 1.05x
- **Active**: Scale 1.05x with color change
- **Transition**: 300ms smooth

#### Empty States
- **Fade In**: 500ms ease-out
- **Icon**: Gentle rotation animation (infinite loop)
- **Message**: Fades in after icon

#### Implementation
```tsx
<motion.div
  variants={staggerContainerVariants}
  initial="hidden"
  animate="visible"
>
  <AnimatePresence mode="popLayout">
    {tasks.map(task => <TaskItem key={task.id} />)}
  </AnimatePresence>
</motion.div>
```

### 6. Keyholder Task Management

#### Add Task Button
- **Icon**: Rotates 45° when form is open (becomes an X)
- **Hover**: Scale 1.05x
- **Transition**: 200ms

#### Approval/Rejection Buttons
- **Hover**: Scale 1.05x
- **Active**: Scale 0.95x
- **Processing**: Icon rotates (approve) or shakes (reject)

## CSS Animations

### Keyframes Available

```css
@keyframes slideInRight { /* Slide from right */ }
@keyframes slideOutLeft { /* Slide to left */ }
@keyframes scaleIn { /* Scale up fade in */ }
@keyframes pulse { /* Gentle pulsing */ }
@keyframes shake { /* Side-to-side shake */ }
@keyframes bounce-celebration { /* Bouncing effect */ }
@keyframes progress-bar { /* Linear progress */ }
```

### Utility Classes

```css
.animate-slide-in-right
.animate-slide-out-left
.animate-scale-in
.animate-pulse
.animate-shake
.animate-bounce-celebration
```

## Accessibility

### Prefers-Reduced-Motion

All animations respect the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

JavaScript check:
```typescript
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
```

### Implementation
- All Framer Motion animations use `getTransition()` helper
- Helper returns duration of 0 when reduced motion is preferred
- CSS animations are disabled via media query
- Elements instantly show without animation

## Performance Considerations

### Optimization Techniques
1. **Hardware Acceleration**: Use `transform` and `opacity` properties
2. **React.memo**: Memoized components prevent unnecessary re-renders
3. **Layout Animations**: Framer Motion's `layout` prop for smooth transitions
4. **AnimatePresence**: Efficient mount/unmount animations
5. **CSS Variables**: Consistent timing values

### Performance Targets
- **60fps**: All animations maintain 60 frames per second
- **No Jank**: No layout thrashing or forced reflows
- **Smooth**: Animations feel natural and responsive
- **Non-blocking**: Animations never prevent user interaction

### Best Practices
```typescript
// ✅ Good - Hardware accelerated
transform: "translateX(10px)"

// ❌ Avoid - Triggers layout
left: "10px"

// ✅ Good - Opacity changes
opacity: 0.5

// ❌ Avoid - Display changes
display: "none" // Use AnimatePresence instead
```

## Testing

### Unit Tests
- Location: `src/utils/__tests__/animations.test.ts`
- Coverage: Animation utilities, variants, reduced motion
- Run: `npm run test:unit`

### Manual Testing Checklist
- [ ] Animations run at 60fps on desktop
- [ ] Animations work on mobile devices
- [ ] Reduced motion preference is respected
- [ ] No animation jank or stuttering
- [ ] Buttons provide tactile feedback
- [ ] Loading states are clear
- [ ] Transitions feel natural

## Future Enhancements

### Optional Features
1. **Confetti Animation**: For major task completions
2. **Points Counter**: Animated number counting
3. **Achievement Popups**: Special celebration for milestones
4. **Particle Effects**: Subtle background particles
5. **Micro-interactions**: More detailed hover states

### Performance Improvements
1. **Dynamic Imports**: Lazy-load animation library
2. **Intersection Observer**: Animate only visible elements
3. **Request Animation Frame**: Custom animation loop
4. **Web Animations API**: Native browser animations

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [CSS Easing Functions](https://easings.net/)
- [Material Motion Guidelines](https://material.io/design/motion)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

## Troubleshooting

### Common Issues

**Animations not appearing**
- Check if `prefers-reduced-motion` is enabled
- Verify Framer Motion is installed
- Check console for errors

**Janky animations**
- Use `transform` instead of `top`/`left`
- Reduce animation complexity
- Check for layout thrashing

**Animations too slow/fast**
- Adjust duration values in `animations.ts`
- Use CSS variables for consistency
- Test on target devices

**Memory leaks**
- Always cleanup intervals/timeouts
- Use `useEffect` cleanup functions
- Unmount unused components
