
export const generateDriverCode = (language, userCode, examples, originalStarterCode) => {
    // Driver Generator v2 - Force Refresh
    // 1. Utilities
    const parseInputString = (inputStr) => {
        const args = [];
        const parts = inputStr.split(/,\s*(?=\w+\s*=)/);
        parts.forEach(part => {
            const valueMatch = part.match(/=\s*(.*)/);
            if (valueMatch) {
                let valStr = valueMatch[1].trim();
                try {
                    valStr = valStr.replace(/'/g, '"').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
                    args.push(JSON.parse(valStr));
                } catch (e) {
                    args.push(valStr);
                }
            }
        });
        return args;
    };

    const starterToParse = originalStarterCode || userCode || "";

    // 2. Generators 

    // --- JAVASCRIPT ---
    if (language === "javascript") {
        let functionName = "solution";
        // Support: function foo(), const foo = function(), const foo = () =>, var foo = ...
        const m1 = userCode.match(/(?:var|const|let)\s+(\w+)\s*=\s*(?:function|\(?[\w\s,]*\)?\s*=>)/);
        const m2 = userCode.match(/function\s+(\w+)\s*\(/);
        if (m1) functionName = m1[1];
        else if (m2) functionName = m2[1];

        const inputs = examples.map(ex => ({ args: parseInputString(ex.input), expected: ex.output }));

        // Sanitize user code for execution (remove exports)
        const safeUserCode = userCode.replace(/export\s+default\s+|export\s+/g, '');

        return `
${safeUserCode}

const results = [];
let passed = 0;
const tests = ${JSON.stringify(inputs)};

try {
    tests.forEach((test, i) => {
        try {
            if (typeof ${functionName} === 'undefined') throw new Error("Function '${functionName}' not found. Check naming.");
            const result = ${functionName}(...test.args);
            let actualStr = JSON.stringify(result);
            let expectedStr = test.expected.replace(/\\s/g, '');
            let normActual = actualStr ? actualStr.replace(/\\s/g, '') : "undefined";
            let isPass = (normActual === expectedStr) || (String(result) === test.expected);
            if (isPass) passed++;
            results.push({
                id: i,
                passed: isPass,
                actual: actualStr,
                expected: test.expected,
                id: i,
                passed: isPass,
                actual: actualStr,
                expected: test.expected,
                input: test.args.map(a => JSON.stringify(a)).join(", ")
            });
        } catch (e) { results.push({ id: i, passed: false, error: e.stack || e.message }); }
    });
    console.log(JSON.stringify({ stats: { passed, total: tests.length }, results }));
} catch (globalErr) {
    console.log(JSON.stringify({ stats: { passed: 0, total: 0 }, results: [], error: "Global Error: " + (globalErr.stack || globalErr.message) }));
}
`;
    }

    // --- PYTHON ---
    if (language === "python" || language === "python3") {
        const m = starterToParse.match(/def\s+(\w+)\s*\(/);
        const functionName = m ? m[1] : "solution";
        const inputs = examples.map(ex => ({ args: parseInputString(ex.input), expected: ex.output }));
        const testsJson = JSON.stringify(inputs);

        return `
import json, sys
import traceback
from typing import *
import collections
import math
import random
import heapq
import functools
import itertools
import inspect

# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def list_to_ll(arr):
    if not arr: return None
    head = ListNode(val=arr[0])
    curr = head
    for i in range(1, len(arr)):
        curr.next = ListNode(val=arr[i])
        curr = curr.next
    return head

def ll_to_list(node):
    arr = []
    while node:
        arr.append(node.val)
        node = node.next
    return arr

${userCode}

def run_tests():
    try: tests = json.loads('${testsJson.replace(/'/g, "\\'")}')
    except: tests = []
    
    # helper to serialize results
    def serialize(obj):
        if isinstance(obj, ListNode): return ll_to_list(obj)
        if isinstance(obj, tuple): return list(obj)
        return obj

    sol = None
    func = None
    try: 
        sol = Solution()
        if hasattr(sol, '${functionName}'): func = getattr(sol, '${functionName}')
    except: pass
    
    if not func:
        try: func = ${functionName}
        except: pass

    if not func:
        print(json.dumps({ "stats": { "passed": 0, "total": 0 }, "results": [], "error": "Function not found" }))
        return

    # Check hints to convert inputs
    hints = get_type_hints(func) if hasattr(func, '__annotations__') else {}
    sig = inspect.signature(func)

    passed_count = 0
    results = []
    
    for i, test in enumerate(tests):
        try:
            raw_args = test['args']
            call_args = []
            
            # Map args to params and convert if needed
            try:
                bound_args = sig.bind(*raw_args)
                bound_args.apply_defaults()
                for name, val in bound_args.arguments.items():
                    annotation = hints.get(name) or sig.parameters[name].annotation
                    # Heuristic: Check if annotation string contains 'ListNode'
                    if annotation and 'ListNode' in str(annotation):
                        call_args.append(list_to_ll(val))
                    else:
                        call_args.append(val)
            except:
                # Fallback if bind fails (e.g. variable args), just pass raw
                call_args = raw_args

            result = func(*call_args)
            
            actual_res = serialize(result)
            actual_str = json.dumps(actual_res, separators=(',', ':'))
            expected = test['expected'].replace(" ", "")
            
            # Comparison logic
            is_pass = False
            if actual_str == expected: is_pass = True
            else:
                # Sorted check fallback
                try:
                    if isinstance(actual_res, list):
                        exp_obj = json.loads(test['expected'])
                        if sorted(actual_res) == sorted(exp_obj): is_pass = True
                except: pass
                
                # String lower fallback
                if str(actual_res).lower() == test['expected'].lower(): is_pass = True

            if is_pass: passed_count += 1
            
            input_display = ", ".join([json.dumps(a) for a in raw_args])
            results.append({ "id": i, "passed": is_pass, "actual": actual_str, "expected": expected, "input": input_display })
        except Exception: results.append({ "id": i, "passed": False, "error": traceback.format_exc() })
    print(json.dumps({ "stats": { "passed": passed_count, "total": len(tests) }, "results": results }))
run_tests()
`;
    }

    // --- JAVA ---
    if (language === "java") {
        const sigMatch = starterToParse.match(/(?:public\s+)?(?:static\s+)?([\w<>[\]\s,]+)\s+(\w+)\s*\(([^)]*)\)/);
        if (!sigMatch) return null;
        const methodName = sigMatch[2];
        const argsBody = sigMatch[3];
        const paramTypes = argsBody.split(',').map(s => s.trim().split(/\s+/)[0]);

        let mainBody = `Solution sol = new Solution(); StringBuilder jsonResults = new StringBuilder("["); int passed = 0; int total = 0;`;

        examples.forEach((ex, idx) => {
            const rawArgs = parseInputString(ex.input);
            const expectedStr = ex.output.replace(/"/g, '\\"');
            const javaArgs = rawArgs.map((arg, i) => {
                const type = paramTypes[i] || "Object";
                let val = String(arg);
                if (type.includes("string") || type.includes("String")) val = `"${arg}"`;
                else if (type.includes("char")) val = `'${arg}'`;
                else if (type.includes("ListNode")) val = `arrayToList(new int[]{${arg.join(',')}})`;
                else if (type.includes("[]")) {
                    if (Array.isArray(arg)) val = type.includes("List") ? `Arrays.asList(${arg.join(',')})` : `{${arg.join(',')}}`;
                    if (type.includes("int[]") || type.includes("double[]")) val = `new ${type}{${arg.join(',')}}`;
                } else if (type.includes("List")) {
                    // Primitive list heuristic
                    if (Array.isArray(arg)) {
                        // Convert [1,2] -> Arrays.asList(1,2)
                        // handle nested [[1,2]] -> Arrays.asList(Arrays.asList(1,2))
                        const arrayToAsList = (arr) => `Arrays.asList(${arr.map(x => Array.isArray(x) ? arrayToAsList(x) : x).join(',')})`;
                        val = arrayToAsList(arg);
                    }
                }
                return val;
            }).join(", ");

            const prefix = idx > 0 ? "," : "";
            mainBody += `
            total++;
            try {
                Object res = sol.${methodName}(${javaArgs});
                String actual = String.valueOf(res);
                if (res instanceof int[]) actual = java.util.Arrays.toString((int[])res).replaceAll(" ", "");
                else if (res instanceof Object[]) actual = java.util.Arrays.deepToString((Object[])res).replaceAll(" ", "");
                else if (res instanceof java.util.List) actual = res.toString().replaceAll(" ", "");
                else if (res instanceof ListNode) actual = listToString((ListNode)res).replaceAll(" ", "");
                String expected = "${expectedStr}".replaceAll(" ", "");
                boolean isPass = actual.equals(expected);
                if (isPass) passed++;
                String inputStr = ${rawArgs.map(a => Array.isArray(a) ? `java.util.Arrays.toString(new int[]{${a.join(',')}})` : `"${a}"`).join(' + ", " + ')};
                jsonResults.append("${prefix}{\\"id\\":${idx},\\"passed\\":" + isPass + ",\\"actual\\":\\"" + actual.replace("\\\"", "'") + "\\",\\"expected\\":\\"" + expected.replace("\\\"", "'") + "\\",\\"input\\":\\"" + inputStr.replace("\\\"", "'") + "\\"}");
            } catch (Exception e) { 
                StringWriter sw = new StringWriter();
                PrintWriter pw = new PrintWriter(sw);
                e.printStackTrace(pw);
                String err = sw.toString().replace("\\\"", "'").replace("\\n", "\\\\n").replace("\\r", "");
                jsonResults.append("${prefix}{\\"id\\":${idx},\\"passed\\":false,\\"error\\":\\"" + err + "\\"}"); 
            }
            `;
        });

        mainBody += `
        jsonResults.append("]");
        System.out.println("{\\"stats\\":{\\"passed\\":" + passed + ",\\"total\\":" + total + "},\\"results\\":" + jsonResults.toString() + "}");
        `;

        // Inject user code
        const userImports = userCode.match(/import\s+.*;/g) || [];
        const userCodeBody = userCode
            .replace(/import\s+.*;/g, "")
            .replace(/package\s+.*;/g, "")
            .replace(/public\s+class/g, "class");

        return `
import java.util.*;
import java.io.*;
${userImports.join('\n')}

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

public class Main {
    // Helpers
    public static ListNode arrayToList(int[] arr) {
        if (arr.length == 0) return null;
        ListNode head = new ListNode(arr[0]);
        ListNode curr = head;
        for (int i = 1; i < arr.length; i++) {
            curr.next = new ListNode(arr[i]);
            curr = curr.next;
        }
        return head;
    }

    public static String listToString(ListNode head) {
        List<Integer> list = new ArrayList<>();
        while (head != null) {
            list.add(head.val);
            head = head.next;
        }
        return list.toString();
    }

    public static void main(String[] args) {
        ${mainBody}
    }
}

${userCodeBody}
`;
    }

    // --- C# ---
    if (language === "csharp") {
        const sigMatch = starterToParse.match(/(?:public\s+)?(?:static\s+)?([\w<>[\]\s,]+)\s+(\w+)\s*\(([^)]*)\)/);
        if (!sigMatch) return null;
        const methodName = sigMatch[2];
        const argsBody = sigMatch[3];
        const paramTypes = argsBody.split(',').map(s => s.trim().split(/\s+/)[0]);

        let mainBody = `
        Solution sol = new Solution();
        int passed = 0;
        int total = 0;
        System.Text.StringBuilder jsonResults = new System.Text.StringBuilder("[");
        `;

        examples.forEach((ex, idx) => {
            const rawArgs = parseInputString(ex.input);
            const expectedStr = ex.output.replace(/"/g, '\\"');
            const csArgs = rawArgs.map((arg, i) => {
                const type = paramTypes[i] || "object";
                let val = String(arg);
                if (type == "string") val = `"${arg}"`;
                else if (type.includes("[]")) val = `new ${type} {${arg.join(',')}}`;
                else if (type.includes("List")) val = `new ${type} {${arg.join(',')}}`; // C# list init
                // fallback for simple types
                return val;
            }).join(", ");

            const prefix = idx > 0 ? "," : "";
            mainBody += `
            total++;
            try {
                var res = sol.${methodName}(${csArgs});
                string actual = ToJson(res);
                string expected = "${expectedStr}".Replace(" ", "");
                
                // For input display: re-serialize the inputs cleanly
                string inputStr = ${rawArgs.length > 0 ? rawArgs.map((a, i) => {
                return Array.isArray(a) ? `"[${a.join(',')}]"` : `"${a}"`;
            }).join(' + ", " + ') : '""'};
                
                bool isPass = actual == expected;
                if (isPass) passed++;
                
                // Escape quotes for JSON embedding
                string actualEsc = actual.Replace("\\"", "'");
                
                jsonResults.Append($"${prefix}{{\\"id\\":{idx},\\"passed\\":{isPass.ToString().ToLower()},\\"actual\\":\\"{actualEsc}\\",\\"expected\\":\\"{expected}\\", \\"input\\":\\"" + inputStr + "\\"}}");
            } catch (System.Exception e) { jsonResults.Append($"${prefix}{{\\"id\\":{idx},\\"passed\\":false,\\"error\\":\\"{e.Message.Replace("\\"", "'")}\\"}}"); }
            `;
        });

        mainBody += `
        jsonResults.Append("]");
            string finalJson = $"{{\\"stats\\":{{\\"passed\\":{passed},\\"total\\":{total}}},\\"results\\":{jsonResults.ToString()}}}";
            System.Console.WriteLine(finalJson);
            System.Console.Out.Flush();
        `;

        return `using System;
        using System.Collections.Generic;
        using System.Linq;
        using System.Collections;

        public class Program {
            public static string ToJson(object obj) {
                if (obj == null) return "null";
                if (obj is string s) return "\\"" + s + "\\"";
                if (obj is bool b) return b.ToString().ToLower();
                if (obj is IEnumerable en && !(obj is string)) {
                    List < string > items = new List < string > ();
                    foreach(object item in en) items.Add(ToJson(item));
                    return "[" + string.Join(",", items) + "]";
                }
                return obj.ToString();
            }

            public static void Main() {
        try {
            ${mainBody}
        } catch (Exception ex) {
            System.Console.WriteLine($"{{\\"stats\\":{{\\"passed\\":0,\\"total\\":0}},\\"results\\":[],\\"error\\":\\"Global Error: {ex.Message.Replace("\\"", "'")}\\"}}");
        }
    }
}

${userCode}
        `;
    }

    // --- C++ ---
    if (language === "cpp") {
        const sigMatch = starterToParse.match(/([\w<>[\]\s,*&]+)\s+(\w+)\s*\(([^)]*)\)/);
        if (!sigMatch) return null;
        const methodName = sigMatch[2];
        const argsBody = sigMatch[3];
        const paramTypes = argsBody.split(',').map(s => { let t = s.trim(); t = t.substring(0, t.lastIndexOf(' ')).trim(); return t.replace(/[&]/g, '').trim(); });

        let mainBody = `
    Solution sol;
    int passed = 0;
    int total = 0;
        cout << "{\\"results\\": [";
        `;

        examples.forEach((ex, idx) => {
            const rawArgs = parseInputString(ex.input);
            const expectedStr = ex.output.replace(/"/g, '\\"');
            const expectedClean = expectedStr.replace(/\s/g, ''); // strip spaces in JS
            const prefix = idx > 0 ? "," : "";

            let argParams = [];
            const cppArgs = rawArgs.map((arg, i) => {
                let type = paramTypes[i] || "int";
                let val = String(arg);
                if (type.includes("vector")) val = `{${arg.join(',')} } `.replace(/\[/g, '{').replace(/\]/g, '}');
                else if (type == "string") val = `"${arg}"`;
                else if (type.includes("ListNode")) val = `vectorToLinkedList({${arg.join(',')}})`;
                return { type, val };
            });

            mainBody += `
        {
            total++;
            if (${idx} > 0) cout << ",";
            try {
            ${cppArgs.map((a, i) => `${a.type} arg${i} = ${a.val};`).join(" ")}
            auto res = sol.${methodName} (${cppArgs.map((a, i) => `arg${i}`).join(", ")});
            string actual = to_string(res);
            // Basic string-based validation: strip spaces from actual too if possible, but for simplest C++ we rely on to_string correctness
            // For now, we assume to_string produces compacted output (e.g. [1,2] not [1, 2])
            bool isPass = actual == "${expectedClean}";

                // Construct input display string
                cout << "{\\"id\\":" << ${idx} << ",\\"passed\\":" << (isPass ? "true" : "false") << ", \\"actual\\": " << actual << ", \\"expected\\": \\"${expectedStr} \\", \\"input\\": \\"";
            // Print args as input string
            ${cppArgs.map((a, i) => `cout << ${i > 0 ? '" , " << ' : ""}to_string(arg${i});`).join('\n')}
            cout << "\\"}";

            if (isPass) passed++;
        } catch (...) {
            cout << "{\\"id\\":" << ${idx} << ",\\"passed\\":false, \\"error\\": \\"Runtime Error\\"}";
        }
    }
    `;
        });

        mainBody += `
    cout << "], \\"stats\\": {\\"passed\\": " << passed << ", \\"total\\": " << total << "}}" << endl;
    `;

        return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <sstream>
using namespace std;

// Definition for singly-linked list.
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

// -- JSON Serialization Helpers --
string to_string(string s) { return "\\"" + s + "\\""; }
string to_string(const char* s) { return "\\"" + string(s) + "\\""; }
string to_string(bool b) { return b ? "true" : "false"; }

// ListNode helper
ListNode* vectorToLinkedList(const vector<int>& v) {
    if (v.empty()) return nullptr;
    ListNode* head = new ListNode(v[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < v.size(); ++i) {
        curr->next = new ListNode(v[i]);
        curr = curr->next;
    }
    return head;
}

// Forward declaration for vector
template <typename T> string to_string(const vector<T>& v);

string to_string(ListNode* head) {
    vector<int> v;
    while (head) {
        v.push_back(head->val);
        head = head->next;
    }
    return to_string(v);
}

// Primitives fallback
template <typename T>
string to_string(const vector<T>& v) {
    string res = "[";
    for (size_t i = 0; i < v.size(); ++i) {
        if (i > 0) res += ",";
        res += to_string(v[i]);
    }
    res += "]";
    return res;
}

template<typename T>
typename enable_if<is_arithmetic<T>::value, string>::type
to_string(T val) {
    return std::to_string(val);
}

#line 1 "solution.cpp"
${userCode}

int main() {
    ${mainBody}
    return 0;
}
`;
    }

    // --- GO ---
    if (language === "go") {
        const sigMatch = starterToParse.match(/func\s+(\w+)\s*\((.*)\)\s*(\w+)/);
        if (!sigMatch) return null;
        const functionName = sigMatch[1];
        // Go arguments parsing is complex, assuming simple for specific Leetcode style
        // func longestPalindromicSubsequence(s string, k int) int

        // Simple manual argument mapping
        let mainBody = `
                        passed := 0
                        total := 0
                        fmt.Print("{\\"results\\": [")
                        `;

        examples.forEach((ex, idx) => {
            const rawArgs = parseInputString(ex.input);
            const expectedStr = ex.output.replace(/"/g, '\\"');

            const goArgs = rawArgs.map(arg => {
                if (typeof arg === 'string') return `"${arg}"`;
                return String(arg);
            }).join(", ");

            mainBody += `
                        total++
                        if ${idx} > 0 {fmt.Print(",")}
                        {
                            res := ${functionName}(${goArgs})
                        actual := fmt.Sprintf("%v", res)
                        expected := "${expectedStr}"
                        isPass := actual == expected
                        if isPass {passed++}
                        fmt.Printf("{\\"id\\":%d, \\"passed\\":%t, \\"actual\\":\\"%s\\", \\"expected\\":\\"%s\\"}", ${idx}, isPass, actual, expected)
        }
                        `;
        });

        mainBody += `
                        fmt.Printf("], \\"stats\\": {\\"passed\\":%d, \\"total\\":%d}}", passed, total)
                        `;

        return `package main
                        import (
                        "fmt"
                        "strings"
                        "sort"
                        )

                        ${userCode}

                        func main() {
                            ${mainBody}
}
                        `;
    }
    // --- C ---
    if (language === "c") {
        const sigMatch = starterToParse.match(/(\w[\w\s\*]+)\s+(\w+)\s*\(([^)]*)\)\s*\{/);
        if (!sigMatch) return null;
        const returnType = sigMatch[1].trim();
        const methodName = sigMatch[2];
        const argsBody = sigMatch[3];
        const paramTypes = argsBody.split(',').map(s => {
            let t = s.trim();
            return t.substring(0, t.lastIndexOf(' ')).trim();
        });

        let mainBody = `
        int passed = 0;
        int total = 0;
        printf("{\\"results\\": [");
        `;

        examples.forEach((ex, idx) => {
            const rawArgs = parseInputString(ex.input);
            const expectedStr = ex.output.replace(/"/g, '\\"');

            let headerArgs = "";
            const cArgs = rawArgs.map((arg, i) => {
                let type = paramTypes[i] || "int";
                if (type.includes("ListNode")) {
                    // Convert array [1,2] to int arr[] then createList
                    let arrName = "rawArr" + idx + "_" + i;
                    let listName = "list" + idx + "_" + i;
                    headerArgs += `int ${arrName}[] = {${arg.join(',')}}; `;
                    headerArgs += `struct ListNode* ${listName} = createList(${arrName}, ${arg.length}); `;
                    return listName;
                }
                if (type.includes("int*") || type.includes("[]")) {
                    let valName = "arr" + idx + "_" + i;
                    headerArgs += `int ${valName}[] = {${arg.join(',')}}; `;
                    return valName;
                }
                if (type == "char*") return `"${arg}"`;
                return String(arg);
            });

            let callArgs = [];
            if (rawArgs.length == 2 && paramTypes.length == 4) {
                callArgs.push(cArgs[0]); // nums
                callArgs.push(`sizeof(arr${idx}_0)/sizeof(int)`); // numsSize
                callArgs.push(cArgs[1]); // target
            } else {
                callArgs = cArgs;
            }

            let serializationCode = "";
            if (returnType.includes("*")) {
                let callSnippet = "";
                if (rawArgs.length == 2 && paramTypes.length == 4) {
                    callSnippet = `res = ${methodName}(${callArgs.join(", ")}, &retSz);`;
                } else {
                    callSnippet = `res = ${methodName}(${callArgs.join(", ")}); if (res != NULL && retSz == 0) retSz = 2;`;
                }

                serializationCode = `
                int returnSize = 0; 
                int retSz = 0;
                int* res;
                ${callSnippet}
                
                if (res != NULL && retSz > 0) {
                    sprintf(actual, "[");
                    for(int i=0; i<retSz; i++) {
                        char temp[16];
                        sprintf(temp, "%d", res[i]);
                        strcat(actual, temp);
                        if (i < retSz-1) strcat(actual, ",");
                    }
                    strcat(actual, "]");
                } else {
                     sprintf(actual, "[]");
                }
                `;
            } else {
                let callPrimitive = `res = ${methodName}(${callArgs.join(", ")});`;
                serializationCode = `
                // Primitive serialization
                ${(returnType == "int") ? `int res; ${callPrimitive} sprintf(actual, "%d", res);` : ""}
                ${(returnType == "bool") ? `bool res; ${callPrimitive} sprintf(actual, "%s", res ? "true" : "false");` : ""}
                ${(returnType.includes("ListNode")) ? `struct ListNode* res; ${callPrimitive} printList(res, actual);` : ""}
                if (strcmp(actual, "undefined") == 0) sprintf(actual, "unknown_type");
                `;
            }

            mainBody += `
            {
                ${headerArgs}
                total++;
                if (${idx} > 0) printf(",");
                char actual[256] = "undefined";
                ${serializationCode}

                // Input Display
                char inputStr[512] = "${rawArgs.map(a => Array.isArray(a) ? `[%s]`.replace('%s', a.join(',')) : a).join(', ')}";

                char expectedClean[256];
                char actualClean[256];
                strcpy(expectedClean, "${expectedStr}");
                strcpy(actualClean, actual);

                bool isPass = strcmp(actualClean, expectedClean) == 0;
                printf("{\\"id\\": %d, \\"passed\\": %s, \\"actual\\": \\"%s\\", \\"expected\\": \\"${expectedStr}\\", \\"input\\": \\"%s\\"}", ${idx}, isPass ? "true" : "false", actual, inputStr);
                if (isPass) passed++; 
            }
            `;
        });

        mainBody += `
        printf("], \\"stats\\": {\\"passed\\": %d, \\"total\\": %d}}", passed, total);
        `;

        return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#line 1 "solution.c"
struct ListNode {
    int val;
    struct ListNode *next;
};

struct ListNode* createList(int* arr, int size) {
    if (size == 0) return NULL;
    struct ListNode* head = malloc(sizeof(struct ListNode));
    head->val = arr[0];
    head->next = NULL;
    struct ListNode* curr = head;
    for(int i=1; i<size; i++) {
        curr->next = malloc(sizeof(struct ListNode));
        curr = curr->next;
        curr->val = arr[i];
        curr->next = NULL;
    }
    return head;
}

void printList(struct ListNode* head, char* buffer) {
    strcat(buffer, "[");
    struct ListNode* curr = head;
    while(curr != NULL) {
        char temp[32];
        sprintf(temp, "%d", curr->val);
        strcat(buffer, temp);
        if(curr->next != NULL) strcat(buffer, ",");
        curr = curr->next;
    }
    strcat(buffer, "]");
}

${userCode}

int main() {
    ${mainBody}
    return 0;
}
`;
    }

    // --- RUST ---
    if (language === "rust") {
        const sigMatch = starterToParse.match(/pub\s+fn\s+(\w+)\s*\((.*)\)\s*->\s*(.*)\s*\{/);
        const functionName = sigMatch ? sigMatch[1] : "solution";

        // Parsing Rust args from signature is safer
        // fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32>

        let mainBody = `
                            let mut passed = 0;
            let mut total = 0;
            print!("{{\\"results\\": [");
            `;

        examples.forEach((ex, idx) => {
            const rawArgs = parseInputString(ex.input);
            const expectedStr = ex.output.replace(/"/g, '\\"');

            // Rust args
            const rustArgs = rawArgs.map(arg => {
                if (Array.isArray(arg)) return `vec![${arg.join(',')}]`;
                if (typeof arg === 'string') return `"${arg}".to_string()`;
                return String(arg);
            }).join(", ");

            const prefix = idx > 0 ? "," : "";

            mainBody += `
            {
                total += 1;
                if ${idx} > 0 { print!(","); }
                let res = Solution:: ${functionName}(${rustArgs});
        let actual = format!("{:?}", res).replace(" ", "");
        let expected = "${expectedStr}".replace(" ", "");
        let is_pass = actual == expected;
        if is_pass { passed += 1; }
        print!("{{\\"id\\":{ }, \\"passed\\":{ }, \\"actual\\":\\"{}\\", \\"expected\\":\\"{}\\"}}",
            ${idx}, is_pass, actual, expected);
    }
    `;
        });

        mainBody += `
    print!("], \\"stats\\": {{\\"passed\\": { }, \\"total\\": { }}} }}", passed, total);
    `;

        return `use std:: collections:: HashMap;
                            use std:: collections:: HashSet;

                            ${userCode}

                            fn main() {
                                ${mainBody}
    }
    `;
    }

    // --- TYPESCRIPT --- (Re-use JS logic but wrap in ts-node/deno compatible if needed? Piston usually runs TS via tsc->node so JS logic often works if types are stripped or valid)
    // --- TYPESCRIPT ---
    if (language === "typescript") {
        // Reuse JS logic. JS is valid TS.
        // The userCode will be prepended by ProblemPage logic or we ensure consistency.
        // Current ProblemPage logic appends driver if it's JS/TS/Py, but NOT if compiled?
        // Let's assume ProblemPage handles appending for interpreted langs.
        // Wait, if I changed 'main.txt' to 'main.ts', I need to ensure the cod runner works.
        return generateDriverCode("javascript", userCode, examples, originalStarterCode);
    }

    return null;
};
