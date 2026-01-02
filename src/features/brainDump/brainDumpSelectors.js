// Brain Dump Selectors

export const selectBrainDumpIsOpen = (state) => state.brainDump.isOpen;
export const selectBrainDumpRawInput = (state) => state.brainDump.rawInput;
export const selectBrainDumpIsProcessing = (state) => state.brainDump.isProcessing;
export const selectBrainDumpError = (state) => state.brainDump.error;
export const selectBrainDumpStagedTasks = (state) => state.brainDump.stagedTasks;
export const selectBrainDumpUsedFallback = (state) => state.brainDump.usedFallback;
export const selectBrainDumpCurrentView = (state) => state.brainDump.currentView;
export const selectBrainDumpHasBeenDismissed = (state) => state.brainDump.hasBeenDismissed;

// Derived selectors
export const selectStagedTasksCount = (state) => state.brainDump.stagedTasks.length;
export const selectHasStagedTasks = (state) => state.brainDump.stagedTasks.length > 0;
