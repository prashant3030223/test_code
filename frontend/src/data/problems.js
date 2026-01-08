export const PROBLEMS = {
  // --- EASY ---
  "two-sum": {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array • Hash Table",
    companies: ["Google", "Amazon", "Adobe", "Apple"],
    description: {
      text: "Given an array of integers nums and an integer target, return indices of the two numbers in the array such that they add up to target.",
      notes: ["Exactly one solution exists.", "You may not use the same element twice."],
    },
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));`,
      python: `def twoSum(nums, target):\n    prevMap = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in prevMap:\n            return [prevMap[diff], i]\n        prevMap[n] = i`,
      java: `import java.util.*;\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        HashMap<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) return new int[]{map.get(diff), i};\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`,
      c: `/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}`,
      csharp: `public class Solution {\n    public int[] TwoSum(int[] nums, int target) {\n        \n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
      go: `func twoSum(nums []int, target int) []int {\n    \n}`
    },
    expectedOutput: { javascript: "[0,1]", python: "[0, 1]", java: "[0, 1]" }
  },

  "contains-duplicate": {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    category: "Array • Hash Table",
    companies: ["Google", "Amazon", "Apple", "Microsoft"],
    description: {
      text: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    },
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" }
    ],
    starterCode: {
      javascript: `function containsDuplicate(nums) {\n  const set = new Set();\n  for (const n of nums) {\n    if (set.has(n)) return true;\n    set.add(n);\n  }\n  return false;\n}`,
      python: `def containsDuplicate(nums):\n    return len(nums) != len(set(nums))`,
      java: `import java.util.*;\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        HashSet<Integer> set = new HashSet<>();\n        for (int n : nums) {\n            if (set.contains(n)) return true;\n            set.add(n);\n        }\n        return false;\n    }\n}`
    },
    expectedOutput: { javascript: "true", python: "True", java: "true" }
  },

  "valid-anagram": {
    id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    category: "String • Hash Table",
    companies: ["Google", "Amazon", "Uber", "Adobe"],
    description: {
      text: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    },
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" }
    ],
    starterCode: {
      javascript: `function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const count = {};\n  for (let c of s) count[c] = (count[c] || 0) + 1;\n  for (let c of t) {\n    if (!count[c]) return false;\n    count[c]--;\n  }\n  return true;\n}`,
      python: `def isAnagram(s, t):\n    if len(s) != len(t): return False\n    return sorted(s) == sorted(t)`,
      java: `import java.util.*;\nclass Solution {\n    public boolean isAnagram(String s, String t) {\n        char[] sArr = s.toCharArray();\n        char[] tArr = t.toCharArray();\n        Arrays.sort(sArr);\n        Arrays.sort(tArr);\n        return Arrays.equals(sArr, tArr);\n    }\n}`
    },
    expectedOutput: { javascript: "true", python: "True", java: "true" }
  },

  "best-time-to-buy-and-sell-stock": {
    id: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "Array • Dynamic Programming",
    companies: ["Amazon", "Google", "Facebook", "Microsoft"],
    description: {
      text: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
    },
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 6-1 = 5." }
    ],
    starterCode: {
      javascript: `function maxProfit(prices) {\n  let min = prices[0], max = 0;\n  for (let p of prices) {\n    min = Math.min(min, p);\n    max = Math.max(max, p - min);\n  }\n  return max;\n}`,
      python: `def maxProfit(prices):\n    res, minP = 0, prices[0]\n    for p in prices:\n        minP = min(minP, p)\n        res = max(res, p - minP)\n    return res`,
      java: `class Solution {\n    public int maxProfit(int[] prices) {\n        int min = Integer.MAX_VALUE, max = 0;\n        for (int p : prices) {\n            min = Math.min(min, p);\n            max = Math.max(max, p - min);\n        }\n        return max;\n    }\n}`
    },
    expectedOutput: { javascript: "5", python: "5", java: "5" }
  },

  "reverse-linked-list": {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    category: "Linked List • Recursion",
    companies: ["Amazon", "Google", "Adobe", "Microsoft"],
    description: {
      text: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    },
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" }
    ],
    starterCode: {
      javascript: `function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`,
      python: `def reverseList(head):\n    prev, curr = None, head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev`,
      java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) {\n            ListNode next = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n}`
    },
    expectedOutput: { javascript: "[5,4,3,2,1]", python: "[5,4,3,2,1]", java: "[5,4,3,2,1]" }
  },

  "valid-parentheses": {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "Stack • String",
    companies: ["Facebook", "Amazon", "Google", "Microsoft"],
    description: {
      text: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    },
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" }
    ],
    starterCode: {
      javascript: `function isValid(s) {\n  const stack = [];\n  const closeToOpen = { ")": "(", "]": "[", "}": "{" };\n  for (let c of s) {\n    if (closeToOpen[c]) {\n      if (stack.length && stack[stack.length - 1] === closeToOpen[c]) stack.pop();\n      else return false;\n    } else stack.push(c);\n  }\n  return stack.length === 0;\n}`,
      python: `def isValid(s):\n    stack = []\n    map = {")": "(", "]": "[", "}": "{"}\n    for c in s:\n        if c in map:\n            if stack and stack[-1] == map[c]: stack.pop()\n            else: return False\n        else: stack.append(c)\n    return not stack`,
      java: `import java.util.*;\nclass Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') stack.push(')');\n            else if (c == '{') stack.push('}');\n            else if (c == '[') stack.push(']');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}`
    },
    expectedOutput: { javascript: "true", python: "True", java: "true" }
  },

  // --- MEDIUM ---
  "maximum-subarray": {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "Array • Dynamic Programming",
    companies: ["Amazon", "Microsoft", "LinkedIn", "Google"],
    description: {
      text: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    },
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6" }
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  let max = nums[0], cur = 0;\n  for (let n of nums) {\n    cur = Math.max(n, cur + n);\n    max = Math.max(max, cur);\n  }\n  return max;\n}`,
      python: `def maxSubArray(nums):\n    maxS, cur = nums[0], 0\n    for n in nums:\n        cur = max(n, cur + n)\n        maxS = max(maxS, cur)\n    return maxS`,
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        int max = nums[0], cur = 0;\n        for (int n : nums) {\n            cur = Math.max(n, cur + n);\n            max = Math.max(max, cur);\n        }\n        return max;\n    }\n}`
    },
    expectedOutput: { javascript: "6", python: "6", java: "6" }
  },

  "group-anagrams": {
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    category: "Array • Hash Table • String",
    companies: ["Amazon", "Google", "Facebook", "Uber"],
    description: {
      text: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    },
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }
    ],
    starterCode: {
      javascript: `function groupAnagrams(strs) {\n  const res = {};\n  for (let s of strs) {\n    const key = s.split('').sort().join('');\n    if (!res[key]) res[key] = [];\n    res[key].push(s);\n  }\n  return Object.values(res);\n}`,
      python: `def groupAnagrams(strs):\n    res = collections.defaultdict(list)\n    for s in strs:\n        res["".join(sorted(s))].append(s)\n    return res.values()`,
      java: `import java.util.*;\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        Map<String, List<String>> map = new HashMap<>();\n        for (String s : strs) {\n            char[] chars = s.toCharArray();\n            Arrays.sort(chars);\n            String key = String.valueOf(chars);\n            if (!map.containsKey(key)) map.put(key, new ArrayList<>());\n            map.get(key).add(s);\n        }\n        return new ArrayList<>(map.values());\n    }\n}`
    },
    expectedOutput: { javascript: "true", python: "True", java: "true" }
  },

  "number-of-islands": {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    category: "Graph • BFS • DFS",
    companies: ["Amazon", "Google", "Facebook", "Microsoft", "Bloomberg"],
    description: {
      text: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
    },
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" }
    ],
    starterCode: {
      javascript: `function numIslands(grid) {\n  if (!grid.length) return 0;\n  let count = 0;\n  function dfs(r, c) {\n    if (r<0 || r>=grid.length || c<0 || c>=grid[0].length || grid[r][c] === '0') return;\n    grid[r][c] = '0';\n    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);\n  }\n  for (let r=0; r<grid.length; r++) {\n    for (let c=0; c<grid[0].length; c++) {\n      if (grid[r][c] === '1') { count++; dfs(r, c); }\n    }\n  }\n  return count;\n}`,
      python: `def numIslands(grid):\n    if not grid: return 0\n    rows, cols = len(grid), len(grid[0])\n    visit = set()\n    islands = 0\n    def bfs(r, c):\n        q = collections.deque([(r, c)])\n        visit.add((r, c))\n        while q:\n            row, col = q.popleft()\n            directions = [[1,0], [-1,0], [0,1], [0,-1]]\n            for dr, dc in directions:\n                r, c = row + dr, col + dc\n                if (r >= 0 and r < rows and c >= 0 and c < cols and grid[r][c] == "1" and (r, c) not in visit):\n                    q.append((r, c))\n                    visit.add((r, c))\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == "1" and (r, c) not in visit:\n                bfs(r, c)\n                islands += 1\n    return islands`,
      java: `class Solution {\n    public int numIslands(char[][] grid) {\n        int count = 0;\n        for (int i=0; i<grid.length; i++) {\n            for (int j=0; j<grid[0].length; j++) {\n                if (grid[i][j] == '1') {\n                    count++;\n                    dfs(grid, i, j);\n                }\n            }\n        }\n        return count;\n    }\n    private void dfs(char[][] grid, int i, int j) {\n        if (i<0 || i>=grid.length || j<0 || j>=grid[0].length || grid[i][j] == '0') return;\n        grid[i][j] = '0';\n        dfs(grid, i+1, j); dfs(grid, i-1, j); dfs(grid, i, j+1); dfs(grid, i, j-1);\n    }\n}`
    },
    expectedOutput: { javascript: "1", python: "1", java: "1" }
  },

  "top-k-frequent-elements": {
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    category: "Array • Hash Table • Heap",
    companies: ["Amazon", "Google", "Facebook", "Pocket Gems"],
    description: {
      text: "Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.",
    },
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" }
    ],
    starterCode: {
      javascript: `function topKFrequent(nums, k) {\n  const count = {};\n  for (let n of nums) count[n] = (count[n] || 0) + 1;\n  return Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, k).map(Number);\n}`,
      python: `def topKFrequent(nums, k):\n    count = {}\n    freq = [[] for i in range(len(nums) + 1)]\n    for n in nums: count[n] = 1 + count.get(n, 0)\n    for n, c in count.items(): freq[c].append(n)\n    res = []\n    for i in range(len(freq) - 1, 0, -1):\n        for n in freq[i]:\n            res.append(n)\n            if len(res) == k: return res`,
      java: `import java.util.*;\nclass Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int n : nums) map.put(n, map.getOrDefault(n, 0) + 1);\n        PriorityQueue<Integer> pq = new PriorityQueue<>((a, b) -> map.get(a) - map.get(b));\n        for (int n : map.keySet()) {\n            pq.add(n);\n            if (pq.size() > k) pq.poll();\n        }\n        int[] res = new int[k];\n        for (int i=0; i<k; i++) res[i] = pq.poll();\n        return res;\n    }\n}`
    },
    expectedOutput: { javascript: "[1,2]", python: "[1, 2]", java: "[1, 2]" }
  },

  "longest-substring-without-repeating-characters": {
    id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating",
    difficulty: "Medium",
    category: "String • Sliding Window",
    companies: ["Amazon", "Google", "Adobe", "Microsoft", "Bloomberg"],
    description: {
      text: "Given a string s, find the length of the longest substring without repeating characters.",
    },
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' }
    ],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  let charSet = new Set(), l = 0, res = 0;\n  for (let r = 0; r < s.length; r++) {\n    while (charSet.has(s[r])) {\n      charSet.delete(s[l]); l++;\n    }\n    charSet.add(s[r]);\n    res = Math.max(res, r - l + 1);\n  }\n  return res;\n}`,
      python: `def lengthOfLongestSubstring(s):\n    charSet = set()\n    l = 0\n    res = 0\n    for r in range(len(s)):\n        while s[r] in charSet:\n            charSet.remove(s[l])\n            l += 1\n        charSet.add(s[r])\n        res = max(res, r - l + 1)\n    return res`,
      java: `import java.util.*;\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        Set<Character> set = new HashSet<>();\n        int l = 0, res = 0;\n        for (int r = 0; r < s.length(); r++) {\n            while (set.contains(s.charAt(r))) {\n                set.remove(s.charAt(l)); l++;\n            }\n            set.add(s.charAt(r));\n            res = Math.max(res, r - l + 1);\n        }\n        return res;\n    }\n}`
    },
    expectedOutput: { javascript: "3", python: "3", java: "3" }
  },

  // --- HARD ---
  "median-of-two-sorted-arrays": {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    category: "Array • Binary Search • Divide and Conquer",
    companies: ["Google", "Amazon", "Microsoft", "Apple", "Uber"],
    description: {
      text: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    },
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000" }
    ],
    starterCode: {
      javascript: `function findMedianSortedArrays(nums1, nums2) {\n  const n = [...nums1, ...nums2].sort((a, b) => a - b);\n  const mid = Math.floor(n.length / 2);\n  return n.length % 2 === 0 ? (n[mid - 1] + n[mid]) / 2 : n[mid];\n}`,
      python: `def findMedianSortedArrays(nums1, nums2):\n    A, B = nums1, nums2\n    total = len(A) + len(B)\n    half = total // 2\n    if len(B) < len(A): A, B = B, A\n    l, r = 0, len(A) - 1\n    while True:\n        i = (l + r) // 2\n        j = half - i - 2\n        Aleft = A[i] if i >= 0 else float("-infinity")\n        Aright = A[i+1] if (i+1) < len(A) else float("infinity")\n        Bleft = B[j] if j >= 0 else float("-infinity")\n        Bright = B[j+1] if (j+1) < len(B) else float("infinity")\n        if Aleft <= Bright and Bleft <= Aright:\n            if total % 2: return min(Aright, Bright)\n            return (max(Aleft, Bleft) + min(Aright, Bright)) / 2\n        elif Aleft > Bright: r = i - 1\n        else: l = i + 1`,
      java: `class Solution {\n    public double findMedianSortedArrays(int[] A, int[] B) {\n        // Simplified merge approach for brevity\n        int[] combined = new int[A.length + B.length];\n        System.arraycopy(A, 0, combined, 0, A.length);\n        System.arraycopy(B, 0, combined, A.length, B.length);\n        Arrays.sort(combined);\n        int mid = combined.length / 2;\n        if (combined.length % 2 == 0) return (combined[mid-1] + combined[mid]) / 2.0;\n        return combined[mid];\n    }\n}`
    },
    expectedOutput: { javascript: "2", python: "2.0", java: "2.0" }
  },

  "merge-k-sorted-lists": {
    id: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    category: "Linked List • Divide and Conquer • Heap",
    companies: ["Amazon", "Google", "Facebook", "Microsoft", "Uber"],
    description: {
      text: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    },
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" }
    ],
    starterCode: {
      javascript: `function mergeKLists(lists) {\n  if (!lists.length) return null;\n  // Implementation here\n}`,
      python: `def mergeKLists(lists):\n    if not lists: return None\n    while len(lists) > 1:\n        merged = []\n        for i in range(0, len(lists), 2):\n            l1 = lists[i]\n            l2 = lists[i+1] if (i+1) < len(lists) else None\n            merged.append(merge(l1, l2))\n        lists = merged\n    return lists[0]`,
      java: `class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);\n        for (ListNode l : lists) if (l != null) pq.add(l);\n        ListNode dummy = new ListNode(0), curr = dummy;\n        while (!pq.isEmpty()) {\n            ListNode node = pq.poll();\n            curr.next = node;\n            curr = curr.next;\n            if (node.next != null) pq.add(node.next);\n        }\n        return dummy.next;\n    }\n}`
    },
    expectedOutput: { javascript: "true", python: "True", java: "true" }
  },

  "trapping-rain-water": {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    category: "Array • Two Pointers • Stack",
    companies: ["Amazon", "Google", "Goldman Sachs", "Facebook", "Microsoft"],
    description: {
      text: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    },
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" }
    ],
    starterCode: {
      javascript: `function trap(height) {\n  let l = 0, r = height.length - 1, lMax = 0, rMax = 0, res = 0;\n  while (l < r) {\n    if (height[l] < height[r]) {\n      if (height[l] >= lMax) lMax = height[l]; else res += lMax - height[l];\n      l++;\n    } else {\n      if (height[r] >= rMax) rMax = height[r]; else res += rMax - height[r];\n      r--;\n    }\n  }\n  return res;\n}`,
      python: `def trap(height):\n    if not height: return 0\n    l, r = 0, len(height) - 1\n    lMax, rMax = height[l], height[r]\n    res = 0\n    while l < r:\n        if lMax < rMax:\n            l += 1\n            lMax = max(lMax, height[l])\n            res += lMax - height[l]\n        else:\n            r -= 1\n            rMax = max(rMax, height[r])\n            res += rMax - height[r]\n    return res`,
      java: `class Solution {\n    public int trap(int[] height) {\n        int l = 0, r = height.length-1, lM = 0, rM = 0, res = 0;\n        while (l < r) {\n            if (height[l] < height[r]) {\n                lM = Math.max(lM, height[l]);\n                res += lM - height[l++];\n            } else {\n                rM = Math.max(rM, height[r]);\n                res += rM - height[r--];\n            }\n        }\n        return res;\n    }\n}`
    },
    expectedOutput: { javascript: "6", python: "6", java: "6" }
  }
};

export const LANGUAGE_CONFIG = {
  javascript: {
    name: "JavaScript",
    icon: "/javascript.png",
    monacoLang: "javascript",
  },
  python: {
    name: "Python",
    icon: "/python.png",
    monacoLang: "python",
  },
  java: {
    name: "Java",
    icon: "/java.png",
    monacoLang: "java",
  },
  c: {
    name: "C",
    icon: "/c.png",
    monacoLang: "c",
  },
  cpp: {
    name: "C++",
    icon: "/cpp.png",
    monacoLang: "cpp",
  },
  csharp: {
    name: "C#",
    icon: "/csharp.png",
    monacoLang: "csharp",
  },
  php: { name: "PHP", icon: "/code.png", monacoLang: "php" },
  go: { name: "Go", icon: "/code.png", monacoLang: "go" },
  ruby: { name: "Ruby", icon: "/code.png", monacoLang: "ruby" },
  rust: { name: "Rust", icon: "/code.png", monacoLang: "rust" },
  scala: { name: "Scala", icon: "/code.png", monacoLang: "scala" },
  kotlin: { name: "Kotlin", icon: "/code.png", monacoLang: "kotlin" },
  swift: { name: "Swift", icon: "/code.png", monacoLang: "swift" },
  dart: { name: "Dart", icon: "/code.png", monacoLang: "dart" },
  elixir: { name: "Elixir", icon: "/code.png", monacoLang: "elixir" },
  typescript: { name: "TypeScript", icon: "/code.png", monacoLang: "typescript" },
};
