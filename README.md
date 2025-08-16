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
        uses: Octopus-Moneycoach/version-has-changed@v2
        with:
          path: package.json # Root package.json file
          from: HEAD^1 # Check for changes since previous commit (feel free to put a branch name instead in the form of origin/<branchName>)
          to: HEAD^

      # Do something more meaningful here, like push to NPM, do heavy computing, etc.
      - name: Validate Action Output
        if: steps.changedAction.outputs.changed == 'true' # Check output if it changed or not (returns a boolean)
        run: echo 'package-a changed!'
```

## Advanced Usage (pattern matching):

```yaml
name: 'example-push'
on: push

jobs:
  check-changes:
    name: Frontends changed in last commit?
    runs-on: ubuntu-latest
    outputs:
      changes: ${{ steps.changedVersions.outputs.matched }}
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          fetch-depth: 0 # Necessary so we have commit history to compare to

      - name: Frontends changed in last commit?
        id: changedVersions
        uses: Octopus-Moneycoach/version-has-changed@v2
        with:
          match: frontends/*/package.json # Any frontend package json
          from: HEAD^1 # Check for changes since previous commit (feel free to put a branch name instead in the form of origin/<branchName>)
          to: HEAD^

    # Runs only if 1+ change was found, and create a separate job for each!
    build:
      needs: check-changes
      if: ${{ needs.check-changes.outputs.changes != '[]' }}
      strategy:
        matrix:
          changes: ${{ fromJSON(needs.check-changes.outputs.changes) }}
      steps:
        # Do something more meaningful here, like push to NPM, do heavy computing, etc.
        - name: Log changes
          run: echo '${{ matrix.changes }} changed!'
```
