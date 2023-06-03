import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/antd/dist/antd.dark.css"
        />
        <script src='tesseract.min.js' defer></script>
        {/* <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js" defer></script> */}

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
