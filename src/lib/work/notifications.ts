export type WorkNotification = {
  id: string;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  read: boolean;
  kind: "task" | "time" | "team" | "system" | "message";
};
