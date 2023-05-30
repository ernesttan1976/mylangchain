import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
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
