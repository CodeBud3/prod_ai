// Brain Dump Feature Exports
export { default as brainDumpReducer } from './brainDumpSlice';
export {
    openBrainDump,
    closeBrainDump,
    setRawInput,
    updateStagedTask,
    removeStagedTask,
    goBackToInput,
    clearError,
    processBrainDumpAsync
} from './brainDumpSlice';

export {
    selectBrainDumpIsOpen,
    selectBrainDumpRawInput,
    selectBrainDumpIsProcessing,
    selectBrainDumpError,
    selectBrainDumpStagedTasks,
    selectBrainDumpUsedFallback,
    selectBrainDumpCurrentView,
    selectBrainDumpHasBeenDismissed,
    selectStagedTasksCount,
    selectHasStagedTasks
} from './brainDumpSelectors';

// Components will be added
export { BrainDumpModal } from './components/BrainDumpModal';
