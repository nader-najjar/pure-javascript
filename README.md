# pure-javascript

JavaScript best practices for a standalone process. `Main.ts` is the only application entrypoint. Bazel owns the Node toolchain, locked dependencies, compilation, quality checks, tests, and release assembly.

## 1. Local Development Machine Prerequisites

* Install [Bazelisk](https://bazel.build/install/bazelisk). `.bazelversion` selects Bazel 9.2.0.
* Bazel downloads the pinned Node 24.22.1 and pnpm 10.20.0 toolchains; no separate Node, pnpm, or Nix installation is required.

## 2. Main Build Tasks

```sh
bazel build //...
bazel test //...
```

* Resolves dependencies from `pnpm-lock.yaml` and verifies frozen-lockfile consistency.
* Checks strict types, lint, dependency boundaries, and unused code/dependencies.
* Compiles TypeScript into JavaScript with source maps.
* Runs unit tests with the original 80% statements, branches, functions, and lines coverage thresholds.
* Produces `bazel-bin/executable`, with compiled JavaScript and only production dependencies.
* Tests the release outside Bazel's runfiles, including loading runtime dependencies and rejecting missing Main input without calling AWS.

Vitest's JUnit, HTML coverage, and LCOV reports are retained in `bazel-testlogs/unit_tests/test.outputs/outputs.zip`. `bazel clean` removes build outputs.

### Container packaging

```sh
bazel build //:executable
# Docker is optional and used only to package the completed release.
docker build -f Dockerfile -t template-pure-javascript:latest bazel-bin
```

The Dockerfile uses a digest-pinned Node 24 image, runs as a non-root user, enables source maps, and starts `Main.js`. It does not install dependencies or compile code. Local Bazel builds do not construct an image. The release requires Node 24; it can also run outside a container using the pinned Node path printed by the IDE command below: `/path/to/printed/node --enable-source-maps bazel-bin/executable/Main.js '<input-json>'`.

## 3. Workflows

### Handling NPM Dependencies

NPM dependency entries should never be manually edited. Use the Bazel-pinned pnpm from the repository root:

```sh
bazel run @pnpm//:pnpm -- --dir "$PWD" add <package-name>
bazel run @pnpm//:pnpm -- --dir "$PWD" add -D <package-name>
bazel run @pnpm//:pnpm -- --dir "$PWD" remove <package-name>
bazel run @pnpm//:pnpm -- --dir "$PWD" add <package-name>@<version>
bazel run @pnpm//:pnpm -- --dir "$PWD" update --latest
```

After dependency changes, run `bazel mod deps --lockfile_mode=update`, then the full build and tests. Review and commit `package.json`, `pnpm-lock.yaml`, and `MODULE.bazel.lock` together. Add a new runtime dependency to both `app` and `executable` in `BUILD.bazel`, and extend the release import check in `tools/check-artifact.mjs`. Development dependencies belong only to check targets. Lifecycle scripts are denied by default through `onlyBuiltDependencies: []`; explicitly review any new native dependency before enabling its install script. If a lockfile needs repair, use `bazel run @pnpm//:pnpm -- --dir "$PWD" install --lockfile-only`.

### Updating Toolchains

* Change Node/pnpm versions in `MODULE.bazel`; keep the Node image version and digest in `Dockerfile` aligned.
* Change Bazel's version in `.bazelversion` and rule versions in `MODULE.bazel`.
* Regenerate the Bazel dependency lock with `bazel mod deps --lockfile_mode=update`, then run the full build and tests. Commit `MODULE.bazel.lock`.
* Update `@types/node` using the dependency workflow; review `tsconfig.json` when changing Node or TypeScript.

## 4. IDE Setup

Follow the existing [IntelliJ IDEA setup guide](https://nader-najjar.notion.site/JetBrains-IDE-Setup-Usage-Guide-d9b0a2b78755822f9d03819f5f02feb2?source=copy_link) or [Visual Studio Code setup guide](https://nader-najjar.notion.site/Visual-Studio-Code-Setup-Usage-Guide-f4e0a2b7875583be9293817d26459034?source=copy_link), retaining the multi-repository workspace setup.

```sh
bazel run //:print_node_and_tsdk_paths
# Populate local node_modules for the editor using the same locked dependencies:
bazel run @pnpm//:pnpm -- --dir "$PWD" install --frozen-lockfile
```

In IntelliJ, set **Languages & Frameworks → JavaScript Runtime** to the printed Node executable and pnpm package; set **TypeScript → Node Runtime** to **Project** and the TypeScript package to the printed SDK directory. Enable Automatic ESLint. In VS Code workspace settings, set `js/ts.tsserver.node.path` to the printed Node executable, `js/ts.tsdk.path` to the printed SDK directory, and `js/ts.tsdk.promptToUseWorkspaceVersion` to `true`; select **Use Workspace Version** and reload the window. These Node settings are workspace-wide, so repositories with incompatible Node versions need separate workspaces. Use the printed Node executable for Node run/debug configurations. Re-run the printer after changing the toolchain or cleaning downloaded repositories. Bazel's quality gates use declared build inputs, not the editor's local `node_modules`.

## 5. Application and Quality Boundaries

`src/main/Main.ts` retains process arguments, error exit status, shutdown signals, and resource cleanup. Shared composition, environment validation, executor, AWS/DynamoDB integration, business logic, and utilities remain unchanged except removal of unused Lambda logging context.

The required environment variables are `STAGE`, `AWS_REGION`, `CALCULATION_RESULTS_TABLE_NAME`, `EXAMPLE_STRING_VAR`, `EXAMPLE_INT_VAR`, and `EXAMPLE_BOOLEAN_VAR`. DynamoDB credentials come from the SDK's default provider chain. Unit and release tests do not require credentials or contact AWS.

| Bazel target | Retained responsibility |
| --- | --- |
| `typecheck` | Original strict TypeScript options |
| `lint` | Original ESLint rules and zero warnings; includes build tooling |
| `dependency_boundaries` | Cycles, orphans, main-to-test and main-to-development-dependency boundaries |
| `unused_code` | Knip checks with Main as application entrypoint |
| `unit_tests` | Original retained tests and coverage scope/thresholds |
| `lockfile_consistency` | Frozen pnpm lockfile validation |
| `compile` | JavaScript and source maps |
| `executable` / `artifact_contract` | Production-only portable release and offline smoke test |

`dependency-cruiser` is narrowly ignored by Knip because its executable is referenced from Bazel rather than an npm script; it remains an explicit build dependency. No CI workflows are included.

## 6. References

* [Build and OCI Image Packaging](https://app.notion.com/p/3f90a2b787558157a5c2cf7a9b7e92cc?pvs=204)
* [Bazel](https://bazel.build/)
* [rules_js](https://github.com/aspect-build/rules_js)

## License

All rights reserved. See [LICENSE](LICENSE).
