import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ----- Server-side answer keys (never shipped to the browser) -----
interface McqKey { type: "mcq"; correctIndex: number }
interface CodingKey { type: "coding"; testCases: { input: string; expected: string }[] }
type ExamKey = McqKey | CodingKey;

const EXAM_KEYS: Record<number, ExamKey[]> = {
  1: [
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 2 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "coding", testCases: [
      { input: `reverseString("hello")`, expected: "olleh" },
      { input: `reverseString("React")`, expected: "tcaeR" },
      { input: `reverseString("")`, expected: "" },
    ] },
    { type: "coding", testCases: [
      { input: `findMax([1, 5, 3, 9, 2])`, expected: "9" },
      { input: `findMax([-1, -5, -2])`, expected: "-1" },
      { input: `findMax([42])`, expected: "42" },
    ] },
    { type: "coding", testCases: [
      { input: `countVowels("hello")`, expected: "2" },
      { input: `countVowels("AEIOU")`, expected: "5" },
      { input: `countVowels("xyz")`, expected: "0" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(flattenArray([[1,2],[3,4]]))`, expected: "[1,2,3,4]" },
      { input: `JSON.stringify(flattenArray([1,[2,[3]]]))`, expected: "[1,2,3]" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(compact([0, 1, false, 2, '', 3]))`, expected: "[1,2,3]" },
      { input: `JSON.stringify(compact([null, undefined, NaN, "hello"]))`, expected: '["hello"]' },
    ] },
  ],
  2: [
    { type: "mcq", correctIndex: 2 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 2 },
    { type: "coding", testCases: [
      { input: `isEven(4)`, expected: "true" },
      { input: `isEven(7)`, expected: "false" },
      { input: `isEven(0)`, expected: "true" },
    ] },
    { type: "coding", testCases: [
      { input: `sumArray([1, 2, 3])`, expected: "6" },
      { input: `sumArray([10, -5, 5])`, expected: "10" },
      { input: `sumArray([])`, expected: "0" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(removeDuplicates([1,2,2,3,3,4]))`, expected: "[1,2,3,4]" },
      { input: `JSON.stringify(removeDuplicates([1,1,1]))`, expected: "[1]" },
    ] },
    { type: "coding", testCases: [
      { input: `capitalize("hello world")`, expected: "Hello World" },
      { input: `capitalize("data science")`, expected: "Data Science" },
    ] },
    { type: "coding", testCases: [
      { input: `factorial(5)`, expected: "120" },
      { input: `factorial(0)`, expected: "1" },
      { input: `factorial(1)`, expected: "1" },
    ] },
  ],
  3: [
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "coding", testCases: [
      { input: `simpleHash("abc")`, expected: "294" },
      { input: `simpleHash("")`, expected: "0" },
      { input: `simpleHash("a")`, expected: "97" },
    ] },
    { type: "coding", testCases: [
      { input: `(() => { const c = createCache(); c.set("a",1); c.set("b",2); return c.get("a"); })()`, expected: "1" },
      { input: `(() => { const c = createCache(); c.set("a",1); c.set("b",2); c.set("c",3); return c.get("a"); })()`, expected: "-1" },
    ] },
    { type: "coding", testCases: [
      { input: `canRequest([1, 2, 3], 5)`, expected: "false" },
      { input: `canRequest([1, 2], 5)`, expected: "true" },
      { input: `canRequest([], 5)`, expected: "true" },
    ] },
    { type: "coding", testCases: [
      { input: `shortId(0)`, expected: "0" },
      { input: `shortId(61)`, expected: "Z" },
      { input: `shortId(62)`, expected: "10" },
    ] },
    { type: "coding", testCases: [
      { input: `retry(() => "ok", 3)`, expected: "ok" },
      { input: `(() => { let i=0; return retry(() => { i++; if(i<3) throw new Error(); return "done"; }, 5); })()`, expected: "done" },
    ] },
  ],
  4: [
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 2 },
    { type: "mcq", correctIndex: 2 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 2 },
    { type: "coding", testCases: [
      { input: `JSON.stringify(twoSum([2,7,11,15], 9))`, expected: "[0,1]" },
      { input: `JSON.stringify(twoSum([3,2,4], 6))`, expected: "[1,2]" },
    ] },
    { type: "coding", testCases: [
      { input: `isPalindrome("racecar")`, expected: "true" },
      { input: `isPalindrome("hello")`, expected: "false" },
      { input: `isPalindrome("a")`, expected: "true" },
    ] },
    { type: "coding", testCases: [
      { input: `fibonacci(0)`, expected: "0" },
      { input: `fibonacci(1)`, expected: "1" },
      { input: `fibonacci(6)`, expected: "8" },
      { input: `fibonacci(10)`, expected: "55" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(fizzBuzz(5))`, expected: '["1","2","Fizz","4","Buzz"]' },
      { input: `JSON.stringify(fizzBuzz(3))`, expected: '["1","2","Fizz"]' },
    ] },
    { type: "coding", testCases: [
      { input: `missingNumber([3,0,1])`, expected: "2" },
      { input: `missingNumber([0,1])`, expected: "2" },
      { input: `missingNumber([0])`, expected: "1" },
    ] },
  ],
  5: [
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 2 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "coding", testCases: [
      { input: `parseConfig('{"region":"eu-west-1"}')`, expected: "eu-west-1" },
      { input: `parseConfig('{"name":"app"}')`, expected: "us-east-1" },
      { input: `parseConfig('{"region":"ap-south-1","env":"prod"}')`, expected: "ap-south-1" },
    ] },
    { type: "coding", testCases: [
      { input: `s3Cost(100)`, expected: "2.3" },
      { input: `s3Cost(0)`, expected: "0" },
      { input: `s3Cost(1000)`, expected: "23" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(getRunning([{name:"web",status:"running"},{name:"db",status:"stopped"}]))`, expected: '["web"]' },
      { input: `JSON.stringify(getRunning([]))`, expected: "[]" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(generateTags("prod","api"))`, expected: '{"Name":"prod-api","Environment":"prod","Project":"api"}' },
      { input: `JSON.stringify(generateTags("dev","web"))`, expected: '{"Name":"dev-web","Environment":"dev","Project":"web"}' },
    ] },
    { type: "coding", testCases: [
      { input: `hasWriteAccess(["s3:GetObject","s3:PutObject"])`, expected: "true" },
      { input: `hasWriteAccess(["s3:GetObject","s3:ListBucket"])`, expected: "false" },
    ] },
  ],
  6: [
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 1 },
    { type: "mcq", correctIndex: 2 },
    { type: "mcq", correctIndex: 1 },
    { type: "coding", testCases: [
      { input: `JSON.stringify(handleGetUser(2, [{id:1,name:"Alice"},{id:2,name:"Bob"}]))`, expected: '{"id":2,"name":"Bob"}' },
      { input: `handleGetUser(5, [{id:1,name:"Alice"}])`, expected: "null" },
    ] },
    { type: "coding", testCases: [
      { input: `isValidEmail("user@test.com")`, expected: "true" },
      { input: `isValidEmail("invalid")`, expected: "false" },
      { input: `isValidEmail("a@b.c")`, expected: "true" },
      { input: `isValidEmail("@no.com")`, expected: "false" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(parseQuery("name=John&age=30"))`, expected: '{"name":"John","age":"30"}' },
      { input: `JSON.stringify(parseQuery("key=value"))`, expected: '{"key":"value"}' },
    ] },
    { type: "coding", testCases: [
      { input: `slugify("Hello World!")`, expected: "hello-world" },
      { input: `slugify("Node.js & Express")`, expected: "nodejs--express" },
    ] },
    { type: "coding", testCases: [
      { input: `JSON.stringify(apiResponse(200, {id:1}, "OK"))`, expected: '{"status":200,"data":{"id":1},"message":"OK"}' },
      { input: `JSON.stringify(apiResponse(404, null, "Not found"))`, expected: '{"status":404,"data":null,"message":"Not found"}' },
    ] },
  ],
};

const getGradeLetter = (pct: number): string => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
};

const runCodingTests = (code: string, testCases: { input: string; expected: string }[]): boolean => {
  if (typeof code !== "string" || code.length > 20000) return false;
  return testCases.every((tc) => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`${code}\nreturn String(${tc.input});`);
      return String(fn()) === tc.expected;
    } catch {
      return false;
    }
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const courseId = Number(body?.courseId);
    const answers = body?.answers;
    const keys = EXAM_KEYS[courseId];

    if (!keys || !Array.isArray(answers) || answers.length !== keys.length) {
      return new Response(JSON.stringify({ error: "Invalid submission" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Grade entirely server-side
    let score = 0;
    const correctness: boolean[] = keys.map((key, i) => {
      const ans = answers[i];
      let ok = false;
      if (key.type === "mcq") {
        ok = typeof ans?.selectedIndex === "number" && ans.selectedIndex === key.correctIndex;
      } else {
        ok = runCodingTests(String(ans?.code ?? ""), key.testCases);
      }
      if (ok) score++;
      return ok;
    });

    const total = keys.length;
    const pct = Math.round((score / total) * 100);
    const grade = getGradeLetter(pct);
    const passed = pct >= 50;

    const admin = createClient(supabaseUrl, serviceKey);
    const { error: writeError } = await admin.from("course_exam_results").upsert({
      user_id: user.id,
      course_id: courseId,
      score,
      total_questions: total,
      percentage: pct,
      grade,
      passed,
      answers: [],
    }, { onConflict: "user_id,course_id" });

    if (writeError) {
      console.error("grade-course-exam write failed:", writeError.message);
      return new Response(JSON.stringify({ error: "Could not save result" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ score, total, pct, grade, passed, correctness }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grade-course-exam error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
