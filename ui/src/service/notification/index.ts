
export type Notification = {
  message: string,
  description: string,
  type?: "error" | "info",
}
export const notify = (notification:Notification) => {
  // TODO
  alert(notification)
}