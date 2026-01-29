export type NestLangValidationResult = {
  valid: boolean;
  errors: string[];
};

const allowedTypes = ["string", "number", "boolean", "object", "array"];

function validateNestLang(text: string): NestLangValidationResult {
  const errors: string[] = [];
  const lines = text.split("\n").filter(l => l.trim().length > 0);

  // Stack tracks indentation only
  const stack: Array<{ indent: number }> = [];

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const line = rawLine.trim();

    // TOP-LEVEL OR NESTED KEY: "key: (type)"
    if (!line.startsWith("-") && line.includes(":")) {
      const match = line.match(/^([a-zA-Z0-9_]+):\s*(?:\((.*?)\))?$/);

      if (!match) {
        errors.push(`Line ${lineNumber}: Invalid key syntax.`);
        return;
      }

      const [, key, rawType] = match;
      const type = rawType || "string"; // default type

      if (!allowedTypes.includes(type)) {
        errors.push(`Line ${lineNumber}: Invalid type '${type}' for key '${key}'.`);
      }

      // Maintain indentation stack
      while (stack.length && stack[stack.length - 1]!.indent >= indent) {
        stack.pop();
      }

      stack.push({ indent });
      return;
    }

    // CHILD FIELD: "-key: description (type?)"
    if (line.startsWith("-")) {
      const match = line.match(/^-([a-zA-Z0-9_]+):\s*(.*?)(?:\s*\((.*?)\))?$/);

      if (!match) {
        errors.push(`Line ${lineNumber}: Invalid child field syntax.`);
        return;
      }

      const [, key, description, rawType] = match;
      const type = rawType || "string"; // default type

      if (!allowedTypes.includes(type)) {
        errors.push(`Line ${lineNumber}: Invalid type '${type}' for field '${key}'.`);
      }

      if (!description || description.length < 1) {
        errors.push(`Line ${lineNumber}: Description missing for field '${key}'.`);
      }

      // Maintain indentation stack
      while (stack.length && stack[stack.length - 1]!.indent >= indent) {
        stack.pop();
      }

      stack.push({ indent });
      return;
    }

    // ANYTHING ELSE IS INVALID
    errors.push(`Line ${lineNumber}: Invalid NestLang syntax.`);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}



export { validateNestLang };


