// Piston API is a service for code execution

const PISTON_API = "https://emkc.org/api/v2/piston";

const LANGUAGE_VERSIONS = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  c: { language: "c", version: "10.2.0" },
  cpp: { language: "c++", version: "10.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
};

/**
 * @param {string} language - programming language
 * @param {string} code - source code to executed
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
  try {
    const languageConfig = LANGUAGE_VERSIONS[language];

    if (!languageConfig) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
    }

    const response = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: languageConfig.language,
        version: languageConfig.version,
        files: [
          {
            name: getFileName(language),
            content: code,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();

    const output = data.run.output || "";
    const stderr = data.run.stderr || "";

    // Piston returns stderr even for non-fatal errors or warnings (e.g. Java VM info)
    // We should treat it as success if we have output, but append stderr.
    // If NO output and ONLY stderr, then it's a failure.

    if (stderr && !output) {
      return {
        success: false,
        output: output,
        error: stderr,
      };
    }

    return {
      success: true,
      // If we have both, show both (warnings often useful)
      output: output + (stderr ? "\n--- Stderr ---\n" + stderr : ""),
      stderr: stderr
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to execute code: ${error.message}`,
    };
  }
}

function getFileName(language) {
  if (language === "java") return "Main.java";
  if (language === "csharp") return "Program.cs";
  if (language === "c") return "main.c";
  if (language === "cpp") return "main.cpp";
  if (language === "python") return "main.py";
  if (language === "javascript") return "index.js";
  return "main.txt";
}

function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
    c: "c",
    cpp: "cpp",
    csharp: "cs"
  };

  return extensions[language] || "txt";
}
