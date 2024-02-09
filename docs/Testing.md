# Testing

## Integration tests

To run the integration tests, run `make test` in the root.
This will create a backwards-compatible build.

Next, open `test/*.html` in your browser to run the tests.

## Unit tests

There are some in-source tests that can be run with `vitest`, such as in `src/services/aria.ts`.

This is strange, but the in-source tests need to be uncommented to run. Their presence makes the file a module, which is incompatible with the rest of the codebase. You can run localized tests on the file code, then re-comment the tests when you are finished.

There are delimiters there to remove the tests during the build process, since there is no tree-shaking to do this automatically for us.
