import * as pdfParseNamespace from 'pdf-parse';

console.log("pdfParseNamespace type:", typeof pdfParseNamespace);
console.log("pdfParseNamespace keys:", Object.keys(pdfParseNamespace));
console.log("pdfParseNamespace direct:", pdfParseNamespace);
console.log("pdfParseNamespace.default type:", typeof (pdfParseNamespace as any).default);

const pdfParse = ((pdfParseNamespace as any).default || pdfParseNamespace) as any;
console.log("Resolved pdfParse type:", typeof pdfParse);
