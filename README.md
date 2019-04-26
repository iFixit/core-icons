<img width="966" alt="core-icons" src="https://user-images.githubusercontent.com/705973/56824120-a0a7b400-6823-11e9-938c-49fe9d013320.png">

[![npm version](https://img.shields.io/npm/v/@core-ds/icons.svg?style=flat-square)](https://www.npmjs.com/package/@core-ds/icons)

**⚠️ Work in progress**

[Figma file](https://www.figma.com/file/09lHp7uC4KO5MWsaYX5OQQBw/Core-Icons)

## Installation

```shell
npm install @core-ds/icons
```

## Usage

```jsx
import { AlertCircle } from '@core-ds/icons/16' // Import 16px icons
import { Clipboard } from '@core-ds/icons/24' // Import 24px icons

function Example() {
  return (
    <div>
      <AlertCircle />
      <Clipboard />
    </div>
  )
}
```

## Contributing

### Local development setup

Follow these steps to get the project setup on your local machine:

```shell
# Clone repo
git clone https://github.com/iFixit/core-icons.git
cd core-icons

# Install dependencies
npm install

# Add your Figma access token (generate an access token using the instructions below)
echo "FIGMA_TOKEN=<paste-your-token-here>" > .env
# This token gives us access to the Figma API which
# allows us to export icons directly from a Figma file.
```

### Generating a Figma access token

1. Login to your [Figma](https://figma.com) account.
2. Head to the **Account Settings** from the top-left menu inside Figma.
3. Find the **Personal Access Tokens** section.
4. Click **Create new token**.
5. A token will be generated. This will be your only chance to copy the token, so make sure you keep a copy of this in a secure place.

See [Figma's developer docs](https://www.figma.com/developers/docs#access-tokens) for more information.

### Adding or updating an icon

#### 1. Update the Figma file

If a designer has already updated the Figma file, you can skip to step 2. If not, open the [Core Icons Figma file](https://www.figma.com/file/09lHp7uC4KO5MWsaYX5OQQBw/Core-Icons) and make your changes. Reach out on Slack if you're having trouble opening the Figma file.

#### 2. Create a new branch

Create a new branch for your changes:

```shell
git checkout -b <branch>
```

#### 3. Pull changes from Figma

Pull in the latest changes from the Figma file by running:

```shell
npm run figma-pull
```

#### 4. Review, commit and push changes

Review the changes made by `figma-pull`. If everything looks good, commit and push the changes:

```shell
git add .
git commit -m <message>
git push
```

#### 5. Open a pull request

Use GitHub to [create a pull request](https://help.github.com/en/desktop/contributing-to-projects/creating-a-pull-request) for your branch.

#### 6. Bump the package version

After your pull request has been approved, bump the package version by running:

```shell
npm version [patch | minor | major]
```

[`npm version`](https://docs.npmjs.com/cli/version.html) will bump the version and write the new data back to `package.json` and `package-lock.json`. It will also create and push a version commit and tag.

> **Note:** In the context of Core Icons, significant changes to the library or workflow, or removing an icon would be considered a major update, adding a new icon would be considered a minor update, and fixing an icon would be considered a patch.

#### 7. Merge into master

After your pull request has been approved and the package version has been bumped, go ahead and [merge the pull request](https://help.github.com/en/articles/merging-a-pull-request) into master. We have a GitHub action set up to automatically publish the npm package when a commit is pushed to master.

#### 8. Create a release

After your pull request have been merged, [create a new release](https://help.github.com/en/articles/creating-releases) to document your changes. Use the tag you generated in step 6 to create the release.

Done 🎉
