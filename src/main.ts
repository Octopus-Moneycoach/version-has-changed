import {getInput, setFailed, setOutput} from '@actions/core'
import * as exec from '@actions/exec'

const LOOKOUT_VALUE = `~  "version":`

async function run(): Promise<void> {
  try {
    const from = getInput('from', {required: true})
    const to = getInput('to', {required: true})
    const path = getInput('path', {required: true})

    if (!path.includes('package.json')) {
      setFailed('path must include package.json')
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
    if (firstOutput.includes(path)) {
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

      const command = `git diff --unified=0 --no-prefix --color=never --output-indicator-new=~ ${from}..${to} -- ${path} | grep "^[~]"`
      await exec.exec(`/bin/bash -c "${command}"`, [], secondOptions)

      if (secondErrors.length > 0) {
        setFailed(secondErrors)
      }

      if (secondOuptut.includes(LOOKOUT_VALUE)) {
        setOutput('changed', 'true')
      } else {
        setOutput('changed', 'false')
      }
    } else {
      setOutput('changed', 'false')
    }
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
