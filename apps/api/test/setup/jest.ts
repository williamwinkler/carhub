import "reflect-metadata";

jest.setTimeout(15_000);

const focusedTestError =
  "Focused tests are disabled in this suite. Remove .only or set ALLOW_FOCUSED_TESTS=true for local debugging.";

if (process.env.ALLOW_FOCUSED_TESTS !== "true") {
  const forbiddenOnly = new Proxy(
    () => {
      throw new Error(focusedTestError);
    },
    {
      apply() {
        throw new Error(focusedTestError);
      },
      get() {
        return forbiddenOnly;
      },
    },
  );

  (describe as { only: unknown }).only = forbiddenOnly;
  (it as { only: unknown }).only = forbiddenOnly;
  (test as { only: unknown }).only = forbiddenOnly;
}
