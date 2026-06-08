import fs from "fs";
import path from "path";

export interface MDXContent {
  slug: string;
  title: string;
  description: string;
  category: string;
  whatIsIt: string;
  howItWorks: string[];
  warningSigns: string[];
  preventionTips: string[];
  realExamples: string[];
  quiz: {
    question: string;
    options: string[];
    answer: string;
  }[];
}

export function getMDXContent(slug: string): MDXContent | null {
  try {
    const filePath = path.join(process.cwd(), "content", `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return null;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    
    // Parse frontmatter
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = fileContent.match(frontmatterRegex);
    if (!match) return null;

    const frontmatterStr = match[1];
    
    // Simple custom frontmatter parser that handles quotes and arrays
    const parsed: any = {};
    const lines = frontmatterStr.split("\n");
    let currentKey = "";
    let currentArray: string[] = [];
    let currentQuizArray: any[] = [];
    let currentQuizObj: any = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Check if it's a list item
      if (line.startsWith("-")) {
        // If it starts with "- question:" inside quiz, handle it
        if (line.startsWith("- question:")) {
          if (currentQuizObj) {
            currentQuizArray.push(currentQuizObj);
          }
          currentQuizObj = {
            question: cleanValue(line.substring(11)),
            options: []
          };
          currentKey = "quiz_question";
        } else if (line.startsWith("-") && currentKey === "quiz_options") {
          currentQuizObj.options.push(cleanValue(line.substring(1)));
        } else if (currentKey.startsWith("quiz_")) {
          // ignore other dash lists inside quiz unless expected
        } else {
          currentArray.push(cleanValue(line.substring(1)));
        }
        continue;
      }

      // Check if it's a key-value pair
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const key = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();

        // If we were building an array, save it
        if (currentKey && currentArray.length > 0) {
          parsed[currentKey] = currentArray;
          currentArray = [];
        }

        if (key === "question") {
          // handle inline question if needed
        } else if (key === "options") {
          currentKey = "quiz_options";
        } else if (key === "answer") {
          if (currentQuizObj) {
            currentQuizObj.answer = cleanValue(value);
          }
        } else if (value === "" || value === "|") {
          // It's starting an array
          currentKey = key;
        } else {
          parsed[key] = cleanValue(value);
        }
      }
    }

    // Save trailing arrays
    if (currentKey && currentArray.length > 0) {
      parsed[currentKey] = currentArray;
    }
    if (currentQuizObj) {
      currentQuizArray.push(currentQuizObj);
    }
    if (currentQuizArray.length > 0) {
      parsed["quiz"] = currentQuizArray;
    }

    return {
      slug,
      title: parsed.title || "",
      description: parsed.description || "",
      category: parsed.category || "",
      whatIsIt: parsed.whatIsIt || "",
      howItWorks: parsed.howItWorks || [],
      warningSigns: parsed.warningSigns || [],
      preventionTips: parsed.preventionTips || [],
      realExamples: parsed.realExamples || [],
      quiz: parsed.quiz || []
    };
  } catch (err) {
    console.error(`Error reading MDX file ${slug}:`, err);
    return null;
  }
}

function cleanValue(val: string): string {
  val = val.trim();
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.substring(1, val.length - 1);
  }
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.substring(1, val.length - 1);
  }
  return val;
}

export function getAllMDXSlugs(): string[] {
  const contentDir = path.join(process.cwd(), "content");
  if (!fs.existsSync(contentDir)) return [];
  return fs.readdirSync(contentDir)
    .filter(file => file.endsWith(".mdx"))
    .map(file => file.replace(".mdx", ""));
}
