import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
	plugins: [
		usernameClient(),
		adminClient(),
	],
});

export const { signIn, signUp, signOut, useSession, getSession, updateUser } = authClient;
