# Create a video of a code file

Create a video file showing line by line of a code file or React component.

<img src="/examples/sample.gif?raw=true" width="890px" />

![ScreenShot](https://raw.githubusercontent.com/blopa/code-video-creator/main/examples/image.png)

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
npm run generate test.js
```

Where "test.js" should be the path to your file.

## Disclaimer
This is 100% NOT production ready and the code is not optimized at all. Maybe I will make it better in the future

You need to have `ffmpeg` installed for this to work!
