# pure-javascript

> JavaScript best practices.

### 1. Prerequisites

---

Install [Bazelisk](https://bazel.build/install/bazelisk). It reads `.bazelversion`; Bazel supplies Node and pnpm. Run commands from the repository root.

### 2. Build and Test

---

#### Everyday Commands

| Goal | Command |
| --- | --- |
| Compile only | `bazel build //:compile` |
| Unit tests with coverage | `bazel test //:unit_tests` |
| Type check | `bazel test //:typecheck` |
| Lint | `bazel test //:lint` |
| Dependency boundaries / unused code | `bazel test //:dependency_boundaries //:unused_code` |
| Package without checks | `bazel build //:executable` |
| Full verification | `bazel build //... && bazel test //...` |
| Clean outputs | `bazel clean` |
| List targets | `bazel query //...` |

Packaging compiles automatically. Unit tests run TypeScript directly; full verification also checks lockfile consistency and the packaged artifact. Coverage must reach 80%.

Run one test file, or one named test, without the whole-project coverage gate:

```sh
bazel test //:unit_tests --test_arg=src/test/samplebusinesslayer/Calculator.test.ts --test_arg=--coverage.enabled=false
bazel test //:unit_tests --test_arg=src/test/samplebusinesslayer/Calculator.test.ts --test_arg=-t --test_arg='throws on division by zero' --test_arg=--coverage.enabled=false
```

#### Outputs

- Compiled JavaScript: `bazel-bin/build/compiled`.
- Production package: `bazel-bin/executable`.
- JUnit and coverage reports: `bazel-testlogs/unit_tests/test.outputs/outputs.zip`.

### 3. Development Workflows

---

#### Dependency Management

Use the pinned pnpm to update `package.json` and `pnpm-lock.yaml`:

```sh
bazel run @pnpm//:pnpm -- --dir "$PWD" add <package>
bazel run @pnpm//:pnpm -- --dir "$PWD" add -D <package>
bazel run @pnpm//:pnpm -- --dir "$PWD" add -E <package>@<version>
bazel run @pnpm//:pnpm -- --dir "$PWD" remove <package>
bazel run @pnpm//:pnpm -- --dir "$PWD" update <package> --latest
bazel mod deps --lockfile_mode=update
```

Add runtime dependencies to `app` and `executable` in `BUILD.bazel` and the import check in `tools/check-artifact.mjs`. Review lifecycle scripts before enabling them. Build and test; commit the manifest and lockfiles together.

To trace a dependency/version conflict after the IDE install below:

```sh
bazel run @pnpm//:pnpm -- --dir "$PWD" why <package>
```

#### Toolchain Changes

- Bazel: `.bazelversion`.
- Node, pnpm, and rules: `MODULE.bazel`.
- Refresh `MODULE.bazel.lock` with `bazel mod deps --lockfile_mode=update`, then build and test. Review `@types/node` and TypeScript configuration when upgrading Node or TypeScript.

### 4. IDE Setup

---

Prepare editor dependencies and print toolchain paths:

```sh
bazel build @rules_nodejs//nodejs:current_node_runtime @pnpm//:pkg //:node_modules/typescript
bazel cquery 'set(@rules_nodejs//nodejs:current_node_runtime @pnpm//:pkg //:node_modules/typescript)' --output=files \
  | sed "s|^|$(bazel info execution_root)/|"
bazel run @pnpm//:pnpm -- --dir "$PWD" install --frozen-lockfile
```

#### IntelliJ IDEA Ultimate

Follow the [setup guide](https://app.notion.com/p/f4c0a2b7875583b79fa5015d58412fea). Use the printed `node` and pnpm `package` paths for JavaScript Runtime, and the printed TypeScript package’s `lib` directory for TypeScript. Enable Automatic ESLint.

#### Visual Studio Code

Follow the [setup guide](https://app.notion.com/p/4fd0a2b787558204a6c001d0b034f698). Set `js/ts.tsserver.node.path` to the printed `node` and `js/ts.tsdk.path` to the printed TypeScript package’s `lib` directory; select **Use Workspace Version**.

Re-run the commands after toolchain changes or cache cleanup.

### 5. Concepts

---

- [Bazel](https://bazel.build/)
- [rules_js](https://github.com/aspect-build/rules_js)

### 6. Appendix

---

#### Dependency Declarations

| `package.json` field | pnpm add flag | Use |
| --- | --- | --- |
| `dependencies` | Default | Runtime dependencies |
| `devDependencies` | `-D` | Build, test, and editor tools |
| `optionalDependencies` | `-O` | Dependencies whose installation may fail |
| `peerDependencies` | `--save-peer` | Host-provided compatibility contract; also installs as a dev dependency |

`-E` saves an exact version instead of a range. See [pnpm add](https://pnpm.io/10.x/cli/add) for other dependency specifiers.

### License

---

All rights reserved. See [LICENSE](LICENSE).
