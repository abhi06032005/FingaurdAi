import * as pdfParseNamespace from 'pdf-parse';

const PDFParse = (pdfParseNamespace as any).PDFParse;
console.log("load() source:", PDFParse.prototype.load.toString().slice(0, 1000));
console.log("getText() source:", PDFParse.prototype.getText.toString().slice(0, 1000));
