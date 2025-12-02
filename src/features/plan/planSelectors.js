import { createSelector } from '@reduxjs/toolkit'
import { selectAllTasks } from '../tasks/tasksSelectors'

export const selectPlanState = (state) => state.plan
export const selectPlanSummary = (state) => state.plan.summary
export const selectHasPlan = (state) => state.plan.summary !== null
