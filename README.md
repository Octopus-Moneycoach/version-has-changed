# Has Version Changed Github Action

Checks if the version field in a given package.json file has been changed compared to master. Useful for CI/CD pipelines where you want to only run a job if the version has changed.

## Usage:

```yaml
name: 'example-push'
on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Necessary so we have commit history to compare to

      - name: package-a changed in last commit?
        id: changedAction
        uses: Octopus-Moneycoach/version-has-changed@v1
        with:
          path: package.json # Root package.json file
          from: HEAD^1 # Check for changes since previous commit (feel free to put a branch name instead in the form of origin/<branchName>)
          to: HEAD^

      # Do something more meaningful here, like push to NPM, do heavy computing, etc.
      - name: Validate Action Output
        if: steps.changedAction.outputs.changed == 'true' # Check output if it changed or not (returns a boolean)
        run: echo 'package-a changed!'
```