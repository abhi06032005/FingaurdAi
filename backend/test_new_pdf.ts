import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';

async function testNewPdf() {
    try {
        console.log("Instantiating PDFParse with dummy data...");
        // Let's instantiate it with a dummy PDF buffer or a real file if available.
        // If there's no real file, we'll write a small dummy buffer.
        const buffer = Buffer.from('%PDF-1.4 ...');
        const parser = new PDFParse({ data: buffer });
        console.log("PDFParse instance created successfully!");
        
        console.log("Calling parser.getText()...");
        const result = await parser.getText();
        console.log("Parsed result keys:", Object.keys(result));
        console.log("Text length:", result.text.length);
        console.log("Total pages:", result.total);
    } catch (e: any) {
        console.log("Execution failed:", e.message);
    }
}

testNewPdf();
