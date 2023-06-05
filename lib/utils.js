export function PdfToPinecone(pdfDoc) {

    console.log("PdfToPinecone: pdfDoc = ", pdfDoc)

    const PineconeDoc = {
        "vectors": [
            {
                "id": "id",
                "metadata": {},
                "values": [0,0,0]
            }
        ],
        "namespace": ""
    }


    const doc = {
        "pageContent": "Algorithms\nNotes for Professionals\nAlgorithms\nNotes for Professionals\nGoalKicker.com\nFree Programming Books\nDisclaimer\nThis is an unocial free book created for educational purposes and is\nnot aliated with ocial Algorithms group(s) or company(s).\nAll trademarks and registered trademarks are\nthe property of their respective owners\n200+ pages\nof professional hints and tricks",
        "metadata": {
          "source": "C:\\Users\\ernes\\Coding2\\SEI\\Projects\\mylangchain\\public\\uploads\\02 Algorithm Notes for Pros.pdf",
          "pdf": {
            "version": "1.10.100",
            "info": {
              "PDFFormatVersion": "1.4",
              "IsAcroFormPresent": false,
              "IsXFAPresent": false,
              "Title": "Algorithms Notes for Professionals",
              "Author": "GoalKicker.com",
              "Subject": "Algorithms",
              "Keywords": "Algorithms Notes for Professionals",
              "Creator": "TCPDF",
              "Producer": "3-Heights(TM) PDF Optimization Shell 4.8.25.2 (http://www.pdf-tools.com)",
              "CreationDate": "20180218125830+00'00'",
              "ModDate": "D:20180218130824Z"
            },
            "metadata": null,
            "totalPages": 252
          },
          "loc": {
            "pageNumber": 1
          }
        }
      }

}

export function humanizeFileSize(size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return size.toFixed(2) + ' ' + units[i];
  }