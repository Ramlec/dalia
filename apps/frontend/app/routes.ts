import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("users", "routes/users.tsx"),
    route("users/:userId", "routes/users.$userId.tsx"),
] satisfies RouteConfig;
