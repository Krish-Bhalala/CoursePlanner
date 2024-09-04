function testSplitStringByIndices(){
    // Test case 1: Basic splitting
    console.log("Test 1:", splitStringByIndices("hello world", [5]));
    // Expected output: ["hello", " world"]

    // Test case 2: Multiple splits
    console.log("Test 2:", splitStringByIndices("abcdefg", [2, 4]));
    // Expected output: ["ab", "cd", "efg"]

    // Test case 3: No split (empty indices)
    console.log("Test 3:", splitStringByIndices("hello", []));
    // Expected output: ["hello"]

    // Test case 4: Single character string
    console.log("Test 4:", splitStringByIndices("a", [0]));
    // Expected output: ["a"]

    // Test case 5: Indices not starting with 0
    console.log("Test 5:", splitStringByIndices("hello world", [6]));
    // Expected output: ["hello ", "world"]

    // Test case 6: Indices not ending with string length
    console.log("Test 6:", splitStringByIndices("hello world", [0, 5]));
    // Expected output: ["hello", " world"]
}