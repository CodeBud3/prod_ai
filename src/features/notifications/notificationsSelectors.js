export const selectAllNotifications = (state) => state.notifications
export const selectNotificationCount = (state) => state.notifications.length
export const selectHasNotifications = (state) => state.notifications.length > 0
