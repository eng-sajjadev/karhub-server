import { Elysia } from "elysia";
import root from "./plugins/root";
import auth from "./plugins/auth";
import task from "./plugins/task";
import project from "./plugins/project";

const app = new Elysia().use(root).use(auth).use(task).use(project).listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
