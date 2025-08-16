import {getInput, setFailed, setOutput} from '@actions/core'
import * as exec from '@actions/exec'
import wcmatch from 'wildcard-match'

const LOOKOUT_VALUE = `~  "version":`

async function run(): Promise<void> {
  try {
    const from = getInput('from', {required: true})
    const to = getInput('to', {required: true})
    const path = getInput('path', {required: false})
    const match = getInput('match', {required: false})

    if (path && !path.includes('package.json')) {
      setFailed('path must include package.json')
    }

    if (match && !match.endsWith('package.json')) {
      setFailed('match pattern must end with package.json')
    }

    if (!match && !path) {
      setFailed('match or path must be provided')
    }

    let firstOutput = ''
    let firstErrors = ''

    const firstOptions: exec.ExecOptions = {
      listeners: {
        stdout: (data: Buffer) => {
          firstOutput += data.toString()
        },
        stderr: (data: Buffer) => {
          firstErrors += data.toString()
        }
      }
    }

    const firstCommand = `git diff  --name-only ${from}..${to}`

    await exec.exec(firstCommand, [], firstOptions)

    if (firstErrors.length > 0) {
      setFailed(firstErrors)
    }

    const changedFiles = firstOutput.split("\n").map(s => s.trim());
    const matches = new Set<string>();
    if (path && changedFiles.includes(path)) {
      matches.add(path);
    }

    const isMatch = wcmatch(match);
    for (const file of changedFiles) {
      if (!match) {
        break;
      }

      if (isMatch(file)) {
        matches.add(file);
      }
    }

    let changed = false, matchedChanges: string[] = [];
    for (const matchedFile of matches) {
       // If the file is in the diff, now we check if the version has changed
      let secondOuptut = ''
      let secondErrors = ''

      const secondOptions: exec.ExecOptions = {
        listeners: {
          stdout: (data: Buffer) => {
            secondOuptut += data.toString()
          },
          stderr: (data: Buffer) => {
            secondErrors += data.toString()
          }
        }
      }

      // The `{ }` syntax surrounding grep allows us to ignore any grep return
      // value of 1 as it simply means we found no relevant changes. Not that
      //  an error occurred.
      const command = `git diff --unified=0 --no-prefix --color=never --output-indicator-new=~ ${from}..${to} -- ${matchedFile} | { grep "^[~]" || test $? = 1; }`
      await exec.exec(`/bin/bash -c "${command}"`, [], secondOptions)

      if (secondErrors.length > 0) {
        setFailed(secondErrors)
        break;
      }

      if (secondOuptut.includes(LOOKOUT_VALUE)) {
        changed = true;
        // Remove package.json from match
        matchedChanges.push(matchedFile.replace(/\/package\.json$/, ""));
      }
    }

    setOutput("changed", changed);
    setOutput("matched", JSON.stringify(matchedChanges));

  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
