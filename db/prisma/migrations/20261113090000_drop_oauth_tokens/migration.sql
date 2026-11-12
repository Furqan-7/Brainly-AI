-- Brainly never uses Google / GitHub access tokens after sign-in, so stop keeping them
UPDATE "Account" SET "accessToken" = NULL, "refreshToken" = NULL;
