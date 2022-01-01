# Create a video of a code file

Create a video file showing line by line of a code file or React component.

![ScreenShot](https://raw.githubusercontent.com/blopa/code-video-creator/main/image.png)

I have no idea why I made this... but there you go.

## Languages
Add your language and extensions to the file `languages.json` so they can be automatically detected by this script, as long as the language is supported by [Prism.js](https://prismjs.com/).

## How to use
Run
```shell
npm install
```

To install dependencies, then run

```shell
npm run generate Test.jsx
```

Where "Test.jsx" should be the path to your file.

PS: You need to have `ffmpeg` installed for this to work!
