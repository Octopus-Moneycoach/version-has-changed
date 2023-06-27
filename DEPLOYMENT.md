# How to deploy
```shell
npm version patch
npm run package
git add dist
git commit -a -m "prod dependencies"
git push origin release/v1
```

Open a terminal and navigate to your local repository.
Run the command git tag -d v1 to delete the existing v1 tag.
Run the command git tag v1 v1.0.5 to create a new v1 tag that points to the v1.0.5 commit.
Run the command git push --tags --force to update the remote repository with the new v1 tag.