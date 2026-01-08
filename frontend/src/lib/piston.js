// Piston API is a service for code execution

const PISTON_API = "https://emkc.org/api/v2/piston";

const LANGUAGE_VERSIONS = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  c: { language: "c", version: "10.2.0" },
  cpp: { language: "c++", version: "10.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
  php: { language: "php", version: "8.2.3" },
  go: { language: "go", version: "1.19.0" },
  ruby: { language: "ruby", version: "3.0.1" },
  rust: { language: "rust", version: "1.68.2" },
  scala: { language: "scala", version: "3.2.2" },
  kotlin: { language: "kotlin", version: "1.8.20" },
  swift: { language: "swift", version: "5.3.3" },
  dart: { language: "dart", version: "2.19.6" },
  elixir: { language: "elixir", version: "1.12.3" },
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
    const compileOutput = data.compile?.output || "";
    const compileStderr = data.compile?.stderr || "";

    if ((compileStderr || compileOutput) && !output && !stderr) {
      // Compilation failed case
      return {
        success: false,
        output: compileOutput,
        error: compileStderr || compileOutput // sometimes errors are in output for some compilers
      };
    }

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
  if (language === "typescript") return "main.ts";
  if (language === "go") return "main.go";
  if (language === "rust") return "main.rs";

  return "main." + (getFileExtension(language) || "txt");
}

function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
    c: "c",
    cpp: "cpp",
    cpp: "cpp",
    csharp: "cs",
    typescript: "ts",
    go: "go",
    rust: "rs"
  };

  return extensions[language] || "txt";
}
