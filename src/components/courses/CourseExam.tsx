import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ChevronRight, Trophy, AlertCircle, Timer, Play, Code2, CheckCircle, XCircle, Camera, Maximize, ShieldAlert, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useExamProctoring } from "@/hooks/useExamProctoring";

// ----- Types -----
interface MCQQuestion {
  type: "mcq";
  question: string;
  options: string[];
  correctIndex: number;
  codeSnippet?: string;
}

interface CodingQuestion {
  type: "coding";
  question: string;
  description: string;
  starterCode: string;
  testCases: { input: string; expected: string }[];
  hint?: string;
}

type ExamQuestion = MCQQuestion | CodingQuestion;

interface CourseExamProps {
  courseId: number;
  courseTitle: string;
  onCertificateEarned: () => void;
}

// ----- Exam data -----
const courseExams: Record<number, ExamQuestion[]> = {
  1: [
    // MCQs (5)
    { type: "mcq", question: "What is the main benefit of using TypeScript with React?", options: ["Faster runtime", "Static type checking", "Smaller bundle size", "No need for JSX"], correctIndex: 1 },
    { type: "mcq", question: "Which hook is used to manage state in a functional component?", options: ["useEffect", "useRef", "useState", "useContext"], correctIndex: 2 },
    { type: "mcq", question: "What is Context API used for?", options: ["Routing", "State management without prop drilling", "API calls", "Styling"], correctIndex: 1 },
    { type: "mcq", question: "What does React.memo() do?", options: ["Stores data in localStorage", "Memoizes a component to prevent re-renders", "Creates a new state", "Handles routing"], correctIndex: 1 },
    { type: "mcq", question: "What does this useEffect do?", codeSnippet: `useEffect(() => {\n  console.log("hello");\n  return () => console.log("bye");\n}, []);`, options: ["Runs on every render", "Runs once, cleans up on unmount", "Runs only on unmount", "Never runs"], correctIndex: 1 },
    // Coding (5)
    { type: "coding", question: "Write a function that reverses a string", description: "Create a function `reverseString` that takes a string and returns it reversed.", starterCode: `function reverseString(str) {\n  // Your code here\n}`, testCases: [{ input: `reverseString("hello")`, expected: "olleh" }, { input: `reverseString("React")`, expected: "tcaeR" }, { input: `reverseString("")`, expected: "" }], hint: "Try using split, reverse, and join" },
    { type: "coding", question: "Write a function to find the maximum number", description: "Create a function `findMax` that takes an array of numbers and returns the largest one.", starterCode: `function findMax(arr) {\n  // Your code here\n}`, testCases: [{ input: `findMax([1, 5, 3, 9, 2])`, expected: "9" }, { input: `findMax([-1, -5, -2])`, expected: "-1" }, { input: `findMax([42])`, expected: "42" }], hint: "You can use Math.max with spread operator" },
    { type: "coding", question: "Write a function to count vowels", description: "Create a function `countVowels` that returns the number of vowels (a, e, i, o, u) in a string (case-insensitive).", starterCode: `function countVowels(str) {\n  // Your code here\n}`, testCases: [{ input: `countVowels("hello")`, expected: "2" }, { input: `countVowels("AEIOU")`, expected: "5" }, { input: `countVowels("xyz")`, expected: "0" }], hint: "Use a regex or check each character" },
    { type: "coding", question: "Flatten a nested array", description: "Create a function `flattenArray` that takes a nested array and returns a flat array. E.g. [[1,2],[3,[4]]] → [1,2,3,4].", starterCode: `function flattenArray(arr) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(flattenArray([[1,2],[3,4]]))`, expected: "[1,2,3,4]" }, { input: `JSON.stringify(flattenArray([1,[2,[3]]]))`, expected: "[1,2,3]" }], hint: "Use Array.flat(Infinity) or recursion" },
    { type: "coding", question: "Remove falsy values from array", description: "Create a function `compact` that removes all falsy values (false, 0, '', null, undefined, NaN) from an array.", starterCode: `function compact(arr) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(compact([0, 1, false, 2, '', 3]))`, expected: "[1,2,3]" }, { input: `JSON.stringify(compact([null, undefined, NaN, "hello"]))`, expected: '["hello"]' }], hint: "Use filter(Boolean)" },
  ],
  2: [
    // MCQs (5)
    { type: "mcq", question: "What is Python's primary data structure for ordered collections?", options: ["Dictionary", "Set", "List", "Tuple"], correctIndex: 2 },
    { type: "mcq", question: "Which library is used for numerical computing in Python?", options: ["Pandas", "NumPy", "Matplotlib", "Flask"], correctIndex: 1 },
    { type: "mcq", question: "What does a Pandas DataFrame represent?", options: ["A single value", "A 2D labeled data structure", "A graph", "A function"], correctIndex: 1 },
    { type: "mcq", question: "What does this code output?", codeSnippet: `x = [1, 2, 3, 4, 5]\nprint(x[1:3])`, options: ["[1, 2, 3]", "[2, 3]", "[2, 3, 4]", "[1, 2]"], correctIndex: 1 },
    { type: "mcq", question: "Which keyword defines a function in Python?", options: ["function", "func", "def", "fn"], correctIndex: 2 },
    // Coding (5)
    { type: "coding", question: "Write a function to check if a number is even", description: "Create a function `isEven` that returns true if the number is even, false otherwise.", starterCode: `function isEven(n) {\n  // Your code here\n}`, testCases: [{ input: `isEven(4)`, expected: "true" }, { input: `isEven(7)`, expected: "false" }, { input: `isEven(0)`, expected: "true" }], hint: "Use the modulo operator %" },
    { type: "coding", question: "Write a function to sum an array", description: "Create a function `sumArray` that returns the sum of all numbers in an array.", starterCode: `function sumArray(arr) {\n  // Your code here\n}`, testCases: [{ input: `sumArray([1, 2, 3])`, expected: "6" }, { input: `sumArray([10, -5, 5])`, expected: "10" }, { input: `sumArray([])`, expected: "0" }], hint: "Use reduce or a for loop" },
    { type: "coding", question: "Write a function to remove duplicates", description: "Create a function `removeDuplicates` that returns a new array with duplicates removed.", starterCode: `function removeDuplicates(arr) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(removeDuplicates([1,2,2,3,3,4]))`, expected: "[1,2,3,4]" }, { input: `JSON.stringify(removeDuplicates([1,1,1]))`, expected: "[1]" }], hint: "Try using Set" },
    { type: "coding", question: "Write a function to capitalize first letter", description: "Create a function `capitalize` that capitalizes the first letter of each word in a string.", starterCode: `function capitalize(str) {\n  // Your code here\n}`, testCases: [{ input: `capitalize("hello world")`, expected: "Hello World" }, { input: `capitalize("data science")`, expected: "Data Science" }], hint: "Split by space, capitalize each word, join back" },
    { type: "coding", question: "Write a factorial function", description: "Create a function `factorial` that returns n! (e.g. 5! = 120). Return 1 for 0.", starterCode: `function factorial(n) {\n  // Your code here\n}`, testCases: [{ input: `factorial(5)`, expected: "120" }, { input: `factorial(0)`, expected: "1" }, { input: `factorial(1)`, expected: "1" }], hint: "Use a loop or recursion" },
  ],
  3: [
    // MCQs (5)
    { type: "mcq", question: "What is horizontal scaling?", options: ["Adding more RAM", "Adding more servers", "Using a bigger CPU", "Reducing code size"], correctIndex: 1 },
    { type: "mcq", question: "What is the CAP theorem about?", options: ["CPU, API, Protocol", "Consistency, Availability, Partition tolerance", "Cache, Access, Performance", "Code, Architecture, Patterns"], correctIndex: 1 },
    { type: "mcq", question: "What is a CDN?", options: ["Central Data Node", "Content Delivery Network", "Cloud Database Network", "Cache Data Node"], correctIndex: 1 },
    { type: "mcq", question: "What is database sharding?", options: ["Deleting old data", "Splitting data across databases", "Encrypting data", "Backing up data"], correctIndex: 1 },
    { type: "mcq", question: "What caching strategy does this implement?", codeSnippet: `def get_data(key):\n    data = cache.get(key)\n    if data is None:\n        data = db.query(key)\n        cache.set(key, data, ttl=300)\n    return data`, options: ["Write-through", "Cache-aside (Lazy loading)", "Write-behind", "Read-through"], correctIndex: 1 },
    // Coding (5)
    { type: "coding", question: "Implement a simple hash function", description: "Create a function `simpleHash` that takes a string and returns a hash number by summing char codes.", starterCode: `function simpleHash(str) {\n  // Your code here\n}`, testCases: [{ input: `simpleHash("abc")`, expected: "294" }, { input: `simpleHash("")`, expected: "0" }, { input: `simpleHash("a")`, expected: "97" }], hint: "Use charCodeAt() for each character" },
    { type: "coding", question: "Implement a basic LRU cache", description: "Create a function `createCache` that returns an object with `get(key)` and `set(key, value)`. Max 2 items, evict oldest on overflow.", starterCode: `function createCache() {\n  const items = [];\n  return {\n    get(key) {\n      // Return value or -1 if not found\n    },\n    set(key, value) {\n      // Add item, evict oldest if > 2\n    }\n  };\n}`, testCases: [{ input: `(() => { const c = createCache(); c.set("a",1); c.set("b",2); return c.get("a"); })()`, expected: "1" }, { input: `(() => { const c = createCache(); c.set("a",1); c.set("b",2); c.set("c",3); return c.get("a"); })()`, expected: "-1" }], hint: "Use an array and shift() to evict the oldest" },
    { type: "coding", question: "Implement rate limiter check", description: "Create a function `canRequest` that takes an array of timestamps and a window (in seconds). Return true if less than 3 requests in the window.", starterCode: `function canRequest(timestamps, windowSec) {\n  // Your code here\n}`, testCases: [{ input: `canRequest([1, 2, 3], 5)`, expected: "false" }, { input: `canRequest([1, 2], 5)`, expected: "true" }, { input: `canRequest([], 5)`, expected: "true" }], hint: "Count timestamps within the window" },
    { type: "coding", question: "Implement URL shortener hash", description: "Create a function `shortId` that takes a number and returns a base-62 string (0-9, a-z, A-Z).", starterCode: `function shortId(num) {\n  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";\n  // Your code here\n}`, testCases: [{ input: `shortId(0)`, expected: "0" }, { input: `shortId(61)`, expected: "Z" }, { input: `shortId(62)`, expected: "10" }], hint: "Use modulo and division like base conversion" },
    { type: "coding", question: "Implement retry with max attempts", description: "Create a function `retry` that calls a function up to n times. Return the result on success or 'failed' if all attempts fail.", starterCode: `function retry(fn, maxAttempts) {\n  // Your code here\n}`, testCases: [{ input: `retry(() => "ok", 3)`, expected: "ok" }, { input: `(() => { let i=0; return retry(() => { i++; if(i<3) throw new Error(); return "done"; }, 5); })()`, expected: "done" }], hint: "Use a for loop with try/catch" },
  ],
  4: [
    // MCQs (5)
    { type: "mcq", question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctIndex: 1 },
    { type: "mcq", question: "Which data structure uses LIFO?", options: ["Queue", "Array", "Stack", "Linked List"], correctIndex: 2 },
    { type: "mcq", question: "What is a hash table's average lookup time?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], correctIndex: 2 },
    { type: "mcq", question: "What is Big O notation?", options: ["A programming language", "A way to describe algorithm efficiency", "A data structure", "A design pattern"], correctIndex: 1 },
    { type: "mcq", question: "Which sorting algorithm has O(n log n) average case?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correctIndex: 2 },
    // Coding (5)
    { type: "coding", question: "Implement Two Sum", description: "Create a function `twoSum` that finds two indices whose values add up to the target. Return [i, j].", starterCode: `function twoSum(nums, target) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(twoSum([2,7,11,15], 9))`, expected: "[0,1]" }, { input: `JSON.stringify(twoSum([3,2,4], 6))`, expected: "[1,2]" }], hint: "Use a hashmap to store seen values" },
    { type: "coding", question: "Check if a string is a palindrome", description: "Create a function `isPalindrome` that returns true if the string reads the same forwards and backwards.", starterCode: `function isPalindrome(str) {\n  // Your code here\n}`, testCases: [{ input: `isPalindrome("racecar")`, expected: "true" }, { input: `isPalindrome("hello")`, expected: "false" }, { input: `isPalindrome("a")`, expected: "true" }], hint: "Compare string with its reverse" },
    { type: "coding", question: "Implement Fibonacci", description: "Create a function `fibonacci` that returns the nth Fibonacci number (0-indexed: fib(0)=0, fib(1)=1).", starterCode: `function fibonacci(n) {\n  // Your code here\n}`, testCases: [{ input: `fibonacci(0)`, expected: "0" }, { input: `fibonacci(1)`, expected: "1" }, { input: `fibonacci(6)`, expected: "8" }, { input: `fibonacci(10)`, expected: "55" }], hint: "Use iteration or memoized recursion" },
    { type: "coding", question: "Implement FizzBuzz", description: "Create a function `fizzBuzz` that returns an array from 1 to n. For multiples of 3: 'Fizz', 5: 'Buzz', both: 'FizzBuzz', else the number as string.", starterCode: `function fizzBuzz(n) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(fizzBuzz(5))`, expected: '["1","2","Fizz","4","Buzz"]' }, { input: `JSON.stringify(fizzBuzz(3))`, expected: '["1","2","Fizz"]' }], hint: "Loop 1 to n, check divisibility" },
    { type: "coding", question: "Find the missing number", description: "Create a function `missingNumber` that takes an array of n distinct numbers from 0 to n, and returns the missing one.", starterCode: `function missingNumber(nums) {\n  // Your code here\n}`, testCases: [{ input: `missingNumber([3,0,1])`, expected: "2" }, { input: `missingNumber([0,1])`, expected: "2" }, { input: `missingNumber([0])`, expected: "1" }], hint: "Use the sum formula: n*(n+1)/2 minus actual sum" },
  ],
  5: [
    // MCQs (5)
    { type: "mcq", question: "What does AWS stand for?", options: ["Advanced Web Systems", "Amazon Web Services", "Automated Web Solutions", "Azure Web Services"], correctIndex: 1 },
    { type: "mcq", question: "Which AWS service provides virtual servers?", options: ["S3", "EC2", "RDS", "Lambda"], correctIndex: 1 },
    { type: "mcq", question: "What is the AWS shared responsibility model?", options: ["AWS handles everything", "Customer handles everything", "AWS secures infra, customer secures data/apps", "No security needed"], correctIndex: 2 },
    { type: "mcq", question: "What is AWS S3 used for?", options: ["Compute", "Object storage", "Database", "Networking"], correctIndex: 1 },
    { type: "mcq", question: "What is AWS Lambda?", options: ["A database", "Serverless compute", "A CDN", "A load balancer"], correctIndex: 1 },
    // Coding (5)
    { type: "coding", question: "Parse a JSON config", description: "Create a function `parseConfig` that takes a JSON string and returns the value of the 'region' key, or 'us-east-1' if not found.", starterCode: `function parseConfig(jsonStr) {\n  // Your code here\n}`, testCases: [{ input: `parseConfig('{"region":"eu-west-1"}')`, expected: "eu-west-1" }, { input: `parseConfig('{"name":"app"}')`, expected: "us-east-1" }, { input: `parseConfig('{"region":"ap-south-1","env":"prod"}')`, expected: "ap-south-1" }], hint: "Use JSON.parse and optional chaining" },
    { type: "coding", question: "Calculate S3 storage cost", description: "Create a function `s3Cost` that takes GB of storage and returns the monthly cost at $0.023 per GB, rounded to 2 decimals.", starterCode: `function s3Cost(gb) {\n  // Your code here\n}`, testCases: [{ input: `s3Cost(100)`, expected: "2.3" }, { input: `s3Cost(0)`, expected: "0" }, { input: `s3Cost(1000)`, expected: "23" }], hint: "Multiply by rate and use parseFloat/toFixed" },
    { type: "coding", question: "Filter running instances", description: "Create a function `getRunning` that takes an array of objects with `{name, status}` and returns names of instances where status is 'running'.", starterCode: `function getRunning(instances) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(getRunning([{name:"web",status:"running"},{name:"db",status:"stopped"}]))`, expected: '["web"]' }, { input: `JSON.stringify(getRunning([]))`, expected: "[]" }], hint: "Use filter then map" },
    { type: "coding", question: "Generate resource tags", description: "Create a function `generateTags` that takes env and project strings, returns an object with Name, Environment and Project keys.", starterCode: `function generateTags(env, project) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(generateTags("prod","api"))`, expected: '{"Name":"prod-api","Environment":"prod","Project":"api"}' }, { input: `JSON.stringify(generateTags("dev","web"))`, expected: '{"Name":"dev-web","Environment":"dev","Project":"web"}' }], hint: "Return an object literal with template strings" },
    { type: "coding", question: "Validate IAM policy actions", description: "Create a function `hasWriteAccess` that takes an array of IAM actions (strings) and returns true if any action contains 'Put' or 'Create'.", starterCode: `function hasWriteAccess(actions) {\n  // Your code here\n}`, testCases: [{ input: `hasWriteAccess(["s3:GetObject","s3:PutObject"])`, expected: "true" }, { input: `hasWriteAccess(["s3:GetObject","s3:ListBucket"])`, expected: "false" }], hint: "Use some() with includes()" },
  ],
  6: [
    // MCQs (5)
    { type: "mcq", question: "What is Node.js?", options: ["A browser", "A JavaScript runtime built on V8", "A database", "A CSS framework"], correctIndex: 1 },
    { type: "mcq", question: "What does JWT stand for?", options: ["JavaScript Web Tool", "JSON Web Token", "Java Web Type", "Just Web Tech"], correctIndex: 1 },
    { type: "mcq", question: "What is REST?", options: ["A database", "An architectural style for APIs", "A programming language", "A testing framework"], correctIndex: 1 },
    { type: "mcq", question: "Which HTTP method is used to update a resource?", options: ["GET", "POST", "PUT", "DELETE"], correctIndex: 2 },
    { type: "mcq", question: "What does this middleware do?", codeSnippet: `const auth = (req, res, next) => {\n  const token = req.headers.authorization?.split(" ")[1];\n  if (!token) return res.status(401).json({ error: "No token" });\n  try {\n    req.user = jwt.verify(token, SECRET);\n    next();\n  } catch {\n    res.status(403).json({ error: "Invalid token" });\n  }\n};`, options: ["Logs requests", "Validates JWT authentication", "Parses request body", "Handles CORS"], correctIndex: 1 },
    // Coding (5)
    { type: "coding", question: "Build a route handler", description: "Create a function `handleGetUser` that takes an id and a users array, returns the user object or null.", starterCode: `function handleGetUser(id, users) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(handleGetUser(2, [{id:1,name:"Alice"},{id:2,name:"Bob"}]))`, expected: '{"id":2,"name":"Bob"}' }, { input: `handleGetUser(5, [{id:1,name:"Alice"}])`, expected: "null" }], hint: "Use array.find()" },
    { type: "coding", question: "Validate an email", description: "Create a function `isValidEmail` that returns true if the string contains exactly one @ and at least one . after it.", starterCode: `function isValidEmail(email) {\n  // Your code here\n}`, testCases: [{ input: `isValidEmail("user@test.com")`, expected: "true" }, { input: `isValidEmail("invalid")`, expected: "false" }, { input: `isValidEmail("a@b.c")`, expected: "true" }, { input: `isValidEmail("@no.com")`, expected: "false" }], hint: "Split by @ and check both parts" },
    { type: "coding", question: "Parse query parameters", description: "Create a function `parseQuery` that takes a query string like 'name=John&age=30' and returns an object.", starterCode: `function parseQuery(queryStr) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(parseQuery("name=John&age=30"))`, expected: '{"name":"John","age":"30"}' }, { input: `JSON.stringify(parseQuery("key=value"))`, expected: '{"key":"value"}' }], hint: "Split by & then by =" },
    { type: "coding", question: "Create a slug from a title", description: "Create a function `slugify` that converts a string to a URL slug (lowercase, spaces to hyphens, remove special chars).", starterCode: `function slugify(title) {\n  // Your code here\n}`, testCases: [{ input: `slugify("Hello World!")`, expected: "hello-world" }, { input: `slugify("Node.js & Express")`, expected: "nodejs--express" }], hint: "Use toLowerCase, replace with regex" },
    { type: "coding", question: "Build a response formatter", description: "Create a function `apiResponse` that takes status, data, and message, returns a formatted object.", starterCode: `function apiResponse(status, data, message) {\n  // Your code here\n}`, testCases: [{ input: `JSON.stringify(apiResponse(200, {id:1}, "OK"))`, expected: '{"status":200,"data":{"id":1},"message":"OK"}' }, { input: `JSON.stringify(apiResponse(404, null, "Not found"))`, expected: '{"status":404,"data":null,"message":"Not found"}' }], hint: "Return an object with the three properties" },
  ],
};

// ----- Helpers -----
const getGrade = (pct: number): { grade: string; color: string; label: string } => {
  if (pct >= 90) return { grade: "A+", color: "#00d4ff", label: "Outstanding" };
  if (pct >= 80) return { grade: "A", color: "#22c55e", label: "Excellent" };
  if (pct >= 70) return { grade: "B", color: "#84cc16", label: "Good" };
  if (pct >= 60) return { grade: "C", color: "#eab308", label: "Satisfactory" };
  if (pct >= 50) return { grade: "D", color: "#f97316", label: "Needs Improvement" };
  return { grade: "F", color: "#ef4444", label: "Failed" };
};

// Run user code against test cases safely
const runCodingTests = (userCode: string, testCases: { input: string; expected: string }[]): { passed: boolean; results: { input: string; expected: string; got: string; pass: boolean }[] } => {
  const results = testCases.map(tc => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`${userCode}\nreturn String(${tc.input});`);
      const got = fn();
      return { input: tc.input, expected: tc.expected, got: String(got), pass: String(got) === tc.expected };
    } catch (e) {
      return { input: tc.input, expected: tc.expected, got: `Error: ${(e as Error).message}`, pass: false };
    }
  });
  return { passed: results.every(r => r.pass), results };
};

// ----- Component -----
const CourseExam = ({ courseId, courseTitle, onCertificateEarned }: CourseExamProps) => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<(boolean | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; pct: number; grade: ReturnType<typeof getGrade> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Coding question state
  const [userCode, setUserCode] = useState("");
  const [codeTestResults, setCodeTestResults] = useState<{ input: string; expected: string; got: string; pass: boolean }[] | null>(null);
  const [codePassed, setCodePassed] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  const questions = courseExams[courseId] || [];
  const EXAM_DURATION = 30 * 60; // 30 minutes fixed

  const finishExam = useCallback((finalScores: (boolean | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = finalScores.filter(s => s === true).length;
    const pct = Math.round((score / questions.length) * 100);
    const grade = getGrade(pct);
    setResult({ score, total: questions.length, pct, grade });
    setShowResult(true);
    saveResult(score, questions.length, pct, grade.grade, pct >= 50);
  }, [questions]);

  useEffect(() => {
    if (!started || showResult) return;
    if (timeLeft <= 0 && started) {
      toast.error("Time's up! Submitting your exam.");
      finishExam(scores);
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, started, showResult]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const resetCodingState = () => {
    setUserCode("");
    setCodeTestResults(null);
    setCodePassed(null);
    setShowHint(false);
  };

  const handleStart = () => {
    setStarted(true);
    setCurrentQ(0);
    setScores(new Array(questions.length).fill(null));
    setSelectedOption(null);
    setShowResult(false);
    setResult(null);
    setTimeLeft(EXAM_DURATION);
    resetCodingState();
    // Set starter code if first question is coding
    const firstQ = questions[0];
    if (firstQ?.type === "coding") setUserCode(firstQ.starterCode);
  };

  const goToNext = (isCorrect: boolean) => {
    const newScores = [...scores];
    newScores[currentQ] = isCorrect;
    setScores(newScores);

    if (currentQ < questions.length - 1) {
      const nextQ = questions[currentQ + 1];
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
      resetCodingState();
      if (nextQ?.type === "coding") setUserCode(nextQ.starterCode);
    } else {
      const finalScores = [...newScores];
      finishExam(finalScores);
    }
  };

  const handleMCQNext = () => {
    if (selectedOption === null) return;
    const q = questions[currentQ] as MCQQuestion;
    goToNext(selectedOption === q.correctIndex);
  };

  const handleRunCode = () => {
    const q = questions[currentQ] as CodingQuestion;
    const { passed, results } = runCodingTests(userCode, q.testCases);
    setCodeTestResults(results);
    setCodePassed(passed);
  };

  const handleSubmitCode = () => {
    if (codePassed === null) {
      handleRunCode();
      return;
    }
    goToNext(codePassed);
  };

  const saveResult = async (score: number, total: number, pct: number, grade: string, passed: boolean) => {
    if (!user) return;
    setSaving(true);
    await supabase.from("course_exam_results").upsert({
      user_id: user.id, course_id: courseId,
      score, total_questions: total, percentage: pct, grade, passed, answers: [],
    }, { onConflict: "user_id,course_id" });

    if (passed) {
      await supabase.from("course_certificates").upsert({
        user_id: user.id, course_id: courseId,
        course_title: courseTitle, grade, percentage: pct,
      }, { onConflict: "user_id,course_id" });
      onCertificateEarned();
    }
    setSaving(false);
  };

  // ----- Start screen -----
  if (!started) {
    const mcqCount = questions.filter(q => q.type === "mcq").length;
    const codingCount = questions.filter(q => q.type === "coding").length;
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 p-6 text-center">
        <ClipboardCheck className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-1">Course Exam</h3>
        <p className="text-xs text-muted-foreground mb-1">
          {questions.length} questions • {mcqCount} MCQs + {codingCount} coding challenges
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          30 min timer • Pass mark: 50% • Earn a certificate!
        </p>
        <Button variant="hero" size="sm" className="gap-1.5" onClick={handleStart}>
          Start Exam <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ----- Result screen -----
  if (showResult && result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-border/50 bg-card/60 p-6 text-center"
      >
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-black"
          style={{
            background: `linear-gradient(135deg, ${result.grade.color}22, ${result.grade.color}11)`,
            border: `2px solid ${result.grade.color}44`,
            color: result.grade.color,
          }}
        >
          {result.grade.grade}
        </div>
        <h3 className="text-xl font-bold mb-1">{result.grade.label}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          You scored <strong className="text-foreground">{result.score}/{result.total}</strong> ({result.pct}%)
        </p>

        {result.pct >= 50 ? (
          <div className="flex items-center justify-center gap-2 text-xs mt-3 mb-4 px-3 py-2 rounded-lg bg-success/10 text-success border border-success/20">
            <Trophy className="w-4 h-4" /> Certificate earned! Check your certificates.
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs mt-3 mb-4 px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-4 h-4" /> You need 50% to pass. Try again!
          </div>
        )}

        <Button variant="outline" size="sm" onClick={handleStart}>
          Retake Exam
        </Button>
      </motion.div>
    );
  }

  const q = questions[currentQ];
  const isCoding = q.type === "coding";

  // ----- Question screen -----
  return (
    <motion.div
      key={currentQ}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-border/50 bg-card/60 overflow-hidden"
    >
      {/* Progress bar */}
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Q{currentQ + 1}/{questions.length}</span>
          {isCoding ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex items-center gap-1">
              <Code2 className="w-3 h-3" /> Coding
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">MCQ</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
            timeLeft <= 30 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-secondary text-muted-foreground"
          }`}>
            <Timer className="w-3 h-3" />
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    i < currentQ
                      ? scores[i] ? "hsl(var(--success, 142 76% 36%))" : "hsl(var(--destructive))"
                      : i === currentQ ? "hsl(var(--primary) / 0.5)" : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-sm font-semibold mb-2">{q.question}</h3>

        {/* MCQ */}
        {q.type === "mcq" && (
          <>
            {q.codeSnippet && (
              <pre
                className="mb-4 p-3 rounded-lg bg-[#0a0f1a] border border-border/30 overflow-x-auto text-[12px] leading-relaxed"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#a5b4fc" }}
              >
                <code>{q.codeSnippet}</code>
              </pre>
            )}
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs transition-all border ${
                    selectedOption === i
                      ? "bg-primary/10 border-primary/30 text-primary font-medium"
                      : "bg-secondary/30 border-border/30 hover:bg-secondary/50"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border mr-2 text-[10px] font-semibold"
                    style={{
                      borderColor: selectedOption === i ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: selectedOption === i ? "hsl(var(--primary) / 0.15)" : "transparent",
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
            <Button variant="hero" size="sm" className="w-full mt-4 gap-1.5" onClick={handleMCQNext} disabled={selectedOption === null}>
              {currentQ === questions.length - 1 ? "Submit Exam" : "Next Question"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Coding question */}
        {q.type === "coding" && (
          <>
            <p className="text-xs text-muted-foreground mb-3">{q.description}</p>

            {/* Code editor */}
            <div className="rounded-lg border border-border/40 overflow-hidden mb-3">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0f1a] border-b border-border/30">
                <span className="text-[10px] text-muted-foreground font-mono">JavaScript</span>
                <div className="flex items-center gap-2">
                  {q.hint && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-[10px] text-warning hover:text-warning/80 transition-colors"
                    >
                      {showHint ? "Hide Hint" : "💡 Hint"}
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={userCode}
                onChange={(e) => { setUserCode(e.target.value); setCodeTestResults(null); setCodePassed(null); }}
                className="w-full min-h-[160px] p-3 bg-[#0a0f1a] text-[12px] leading-relaxed resize-y focus:outline-none"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#e2e8f0", tabSize: 2 }}
                spellCheck={false}
                placeholder="Write your solution here..."
              />
            </div>

            {/* Hint */}
            {showHint && q.hint && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
                💡 {q.hint}
              </div>
            )}

            {/* Run button */}
            <div className="flex gap-2 mb-3">
              <Button variant="default" size="sm" className="gap-1.5 flex-1" onClick={handleRunCode}>
                <Play className="w-3 h-3" /> Run Tests
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="gap-1.5 flex-1"
                onClick={handleSubmitCode}
              >
                {codePassed !== null
                  ? (currentQ === questions.length - 1 ? "Submit Exam" : "Next Question")
                  : "Run & Submit"
                }
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Test results */}
            {codeTestResults && (
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Test Results</span>
                  {codePassed ? (
                    <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> All Passed
                    </span>
                  ) : (
                    <span className="text-[10px] text-destructive font-semibold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {codeTestResults.filter(r => !r.pass).length} Failed
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border/20">
                  {codeTestResults.map((tr, i) => (
                    <div key={i} className="px-3 py-2 flex items-start gap-2">
                      {tr.pass ? (
                        <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-muted-foreground truncate">
                          {tr.input}
                        </p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-[10px]">
                            Expected: <strong className="text-foreground">{tr.expected}</strong>
                          </span>
                          <span className="text-[10px]">
                            Got: <strong className={tr.pass ? "text-success" : "text-destructive"}>{tr.got}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CourseExam;
