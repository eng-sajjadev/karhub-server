import { Elysia } from "elysia";
import root from "./plugins/root";
import auth from "./plugins/auth";

const app = new Elysia().use(root).use(auth).listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
