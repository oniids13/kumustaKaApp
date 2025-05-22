/**
 * Security Test Suite
 * Tests the main security functions implemented for KumustaKa app
 *
 * Run with: node scripts/test-security.js
 */

// ========== SANITIZATION TESTS ==========
console.log("\n==== HTML SANITIZATION TESTS ====");

function sanitizeHtml(content) {
  if (!content) return "";
  if (typeof content !== "string") return String(content);

  // Basic HTML sanitization
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// HTML Sanitization test cases
const htmlTests = [
  {
    name: "Script tag",
    input: '<script>alert("XSS")</script>',
    expectSanitized: true,
  },
  {
    name: "Event handler",
    input: '<img src="x" onerror="alert(1)">',
    expectSanitized: true,
  },
  {
    name: "JavaScript URL",
    input: '<a href="javascript:alert(1)">Click me</a>',
    expectSanitized: true,
  },
  {
    name: "Normal text",
    input: "This is normal text",
    expectSanitized: false,
  },
];

let htmlPassed = 0;
let htmlFailed = 0;

htmlTests.forEach((test) => {
  const sanitized = sanitizeHtml(test.input);
  console.log(`\nTest: ${test.name}`);
  console.log(`Original: ${test.input}`);
  console.log(`Sanitized: ${sanitized}`);

  // Our sanitizer encodes HTML rather than removing it
  // Check if any angle brackets or quotes were encoded
  const containsEncodedChars =
    sanitized.includes("&lt;") ||
    sanitized.includes("&gt;") ||
    sanitized.includes("&quot;");

  // For normal text, there should be no encoding
  const isNormalTextUnchanged =
    test.input === sanitized && !test.expectSanitized;

  const result =
    containsEncodedChars === test.expectSanitized || isNormalTextUnchanged;

  if (result) {
    console.log("✅ PASS - Sanitization working as expected");
    htmlPassed++;
  } else {
    console.log(
      `❌ FAIL - ${
        test.expectSanitized
          ? "Should have been sanitized"
          : "Should not have been changed"
      }`
    );
    htmlFailed++;
  }
});

console.log(
  `\nHTML Sanitization: ${htmlPassed}/${htmlTests.length} passed, ${htmlFailed}/${htmlTests.length} failed`
);

// ========== SQL INJECTION PATTERN TESTS ==========
console.log("\n==== SQL INJECTION PATTERN TESTS ====");

// SQL injection patterns from our middleware
const sqlPatterns = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /(union).+(select)/i,
];

const sqlTests = [
  { input: "1' OR '1'='1", shouldMatch: true },
  { input: "1; DROP TABLE users;--", shouldMatch: true },
  { input: "' UNION SELECT username,password FROM users--", shouldMatch: true },
  { input: "normal-text", shouldMatch: false },
  { input: "123456", shouldMatch: false },
];

let sqlPassed = 0;
let sqlFailed = 0;

for (const test of sqlTests) {
  console.log(`\nTest: "${test.input}"`);

  const detected = sqlPatterns.some((pattern) => pattern.test(test.input));
  console.log(`Detected as SQL injection: ${detected}`);

  const testPassed = detected === test.shouldMatch;

  if (testPassed) {
    console.log("✅ PASS - Pattern detection working as expected");
    sqlPassed++;
  } else {
    console.log("❌ FAIL - Pattern detection not working as expected");
    sqlFailed++;
  }
}

console.log(
  `\nSQL Injection Detection: ${sqlPassed}/${sqlTests.length} passed, ${sqlFailed}/${sqlTests.length} failed`
);

// ========== PROTOTYPE POLLUTION DETECTION TESTS ==========
console.log("\n==== PROTOTYPE POLLUTION DETECTION TESTS ====");

// NOTE: Due to JS engine security, some properties like __proto__ may be hidden
// from enumeration, making the test difficult in Node.js environment.
// In real-world applications, these checks work on user-provided JSON data.
console.log(
  "Note: Some prototype pollution tests may fail due to JS engine limitations"
);

function detectPrototypePollution(obj) {
  if (!obj || typeof obj !== "object") return false;

  // Check key names directly
  const stringObj = JSON.stringify(obj);
  if (
    stringObj.includes('"__proto__":') ||
    stringObj.includes('"constructor":')
  ) {
    return true;
  }

  // Check keys that are visible to Object.keys
  const keys = Object.keys(obj);
  if (keys.includes("__proto__") || keys.includes("constructor")) {
    return true;
  }

  // Recursively check nested objects
  return Object.values(obj).some(
    (val) =>
      typeof val === "object" && val !== null && detectPrototypePollution(val)
  );
}

// For test purposes, use a string representation to simulate JSON payload
// This is more realistic since actual attacks come from JSON payloads
const protoTests = [
  {
    name: "Constructor property",
    input: { constructor: { prototype: { admin: true } } },
    shouldDetect: true,
  },
  {
    name: "Normal object",
    input: { name: "John", role: "user" },
    shouldDetect: false,
  },
];

let protoPassed = 0;
let protoFailed = 0;

for (const test of protoTests) {
  console.log(`\nTest: ${test.name}`);

  try {
    const detected = detectPrototypePollution(test.input);
    console.log(`Detected as prototype pollution: ${detected}`);

    const testPassed = detected === test.shouldDetect;

    if (testPassed) {
      console.log("✅ PASS - Pollution detection working as expected");
      protoPassed++;
    } else {
      console.log("❌ FAIL - Pollution detection not working as expected");
      protoFailed++;
    }
  } catch (error) {
    console.error(`Error testing prototype pollution: ${error.message}`);
    protoFailed++;
  }
}

// Manual JSON string test - more realistic test case
console.log("\nTest: JSON string with __proto__ property");
const jsonString = '{"__proto__": {"admin": true}}';
const jsonObj = JSON.parse(jsonString);
console.log(`JSON input: ${jsonString}`);
const jsonDetected = detectPrototypePollution(jsonObj);
console.log(`Detected as prototype pollution: ${jsonDetected}`);

if (jsonDetected) {
  console.log(
    "✅ PASS - Pollution detection working as expected for JSON input"
  );
  protoPassed++;
} else {
  console.log("❌ FAIL - Pollution detection not working for JSON input");
  protoFailed++;
}

console.log(
  `\nPrototype Pollution Detection: ${protoPassed}/${
    protoTests.length + 1
  } passed, ${protoFailed}/${protoTests.length + 1} failed`
);

// ========== OVERALL RESULTS ==========
console.log("\n==== TEST SUMMARY ====");
const totalTests = htmlTests.length + sqlTests.length + protoTests.length + 1; // +1 for JSON string test
const totalPassed = htmlPassed + sqlPassed + protoPassed;
const totalFailed = htmlFailed + sqlFailed + protoFailed;

console.log(`Total Tests: ${totalTests}`);
console.log(
  `Passed: ${totalPassed} (${Math.round((totalPassed / totalTests) * 100)}%)`
);
console.log(
  `Failed: ${totalFailed} (${Math.round((totalFailed / totalTests) * 100)}%)`
);

if (totalFailed === 0) {
  console.log("\n✅ ALL SECURITY TESTS PASSED");
} else {
  console.log("\n❌ SOME TESTS FAILED");
}

console.log("\n==== COMPLETED ====");
