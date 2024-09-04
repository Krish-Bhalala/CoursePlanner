const axios = require('axios');
const cheerio = require('cheerio');
const courseHtmlIdentifier = ".courseblock";

let COURSE_DATA = {};
let RAW_DATA = [];

/*
COURSE OBJECT SCHEMA
    {
      "id": "COMP4820",
      "department": "COMP",
      "code": "4820",
      "title": "Bioinformatics",
      "credits": 3,
      "description": "An exploration of bioinformatics problems through the lens of Computer Science. Students will discover novel data structures, algorithmic tools, and techniques used to manage, index, and analyze large amounts of data. May not be held with the former COMP 3820.",
      "requirements": {
            "prerequisite": [
                {
                    "courseID": "COMP3170"
                }
            ],
            "corequisite": [
                {
                    "courseID": "COMP2140"
                }
            ],
            "mutuallyExclusive": [
                {
                    "courseID": "COMP3820"
                }
            ],
            "note": "A minimum grade of C is required unless otherwise indicated."
        }
    }
*/

async function scrapeCourseData(){
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://umanitoba-ca-preview.courseleaf.com/undergraduate-studies/course-descriptions/comp/',
    headers: { }
  };

  axios.request(config)
  .then((response) => {
    data = response.data;
    const $ = cheerio.load(data);
    $(courseHtmlIdentifier).each((index, element) => {
      const rawData = $(element).text();
      const cleanData = cleanCourseText(rawData);
      const structuredData = extractCourseInfo(rawData);
      COURSE_DATA[structuredData.id]=structuredData;
      RAW_DATA.push(cleanData);
    });
    //testEmptyIDs();
  })
  .catch((error) => {
    console.log(error);
  });
  
  return COURSE_DATA;
}

function cleanCourseText(text) {
    const cleaningRules = [
      { pattern: /Prerequisite(?:s)?:/i, replacement: "PREREQ:" },
      { pattern: /Pre(?:\s*-\s*)?req(?:uisite)?(?:s)?:/i, replacement: "PREREQ:" },
      { pattern: /Corequisite(?:s)?:/i, replacement: "COREQ:" },
      { pattern: /Pre- or corequisite(?:s)?:/i, replacement: "COREQ:" },
      { pattern: /Mutually Exclusive:/i, replacement: "MUTEXCL:" },
      { pattern: /May not be held with/i, replacement: "MUTEXCL:" },
      { pattern: /concurrent registration:/i, replacement: "MUTEXCL:" },
      { pattern: /Prerequisite(?:s)?:/i, replacement: "PREREQ:" },
      { pattern: /Pre(?:\s*-\s*)?req(?:uisite)?(?:s)?:/i, replacement: "PREREQ:" },
      { pattern: /Attributes:/i, replacement: "ATTR:" },
      { pattern: /PR\/CR:/i, replacement: "NOTE:" },
      { pattern: /Equiv(?:alent)? To:/i, replacement: "EQUIV:" }
    ];
  
    let cleanedText = text;
    cleaningRules.forEach(rule => {
      cleanedText = cleanedText.replace(rule.pattern, rule.replacement);
    });
  
    return cleanedText;
}

function extractCourseInfo(courseText) {
    const cleanedText = cleanCourseText(courseText);
  
    const codeAndTitlePattern = /^([A-Z]{4})\s+(\d{4})\s+(.+?)\s+(\d+(?:\.\d+)?)\s*cr/;
    const descriptionPattern = /\d+\s*cr\s+(.+?)(?=PREREQ:|COREQ:|MUTEXCL:|ATTR:|NOTE:|$)/s;
    const prerequisitePattern = /PREREQ:\s*(.+?)(?=COREQ:|MUTEXCL:|ATTR:|NOTE:|$)/;
    const corequisitePattern = /COREQ:\s*(.+?)(?=PREREQ:|MUTEXCL:|ATTR:|NOTE:|$)/;
    const mutuallyExclusivePattern = /MUTEXCL:\s*(.+?)(?=ATTR:|NOTE:|$)/;
    const attributesPattern = /ATTR:\s*(.+?)$/;
    const notePattern = /NOTE:\s*(.+?)(?=PREREQ:|COREQ:|MUTEXCL:|ATTR:|$)/;
    const equivToPattern = /EQUIV:\s*(.+?)(?=PREREQ:|COREQ:|MUTEXCL:|ATTR:|NOTE:|$)/;

    const codeAndTitleMatch = cleanedText.match(codeAndTitlePattern);
    const descriptionMatch = cleanedText.match(descriptionPattern);
    const prerequisiteMatch = cleanedText.match(prerequisitePattern);
    const corequisiteMatch = cleanedText.match(corequisitePattern);
    const mutuallyExclusiveMatch = cleanedText.match(mutuallyExclusivePattern);
    const attributesMatch = cleanedText.match(attributesPattern);
    const equivToMatch = cleanedText.match(equivToPattern);
    const noteMatch = cleanedText.match(notePattern);
  
    const department = codeAndTitleMatch ? codeAndTitleMatch[1] : "";
    const code = codeAndTitleMatch ? codeAndTitleMatch[2] : "";
  
    function extractCourseIDs(text) {
      if (!text) return [];
      const matches = text.match(/[A-Z]{4}\s*\d{4}/g);
      return matches ? matches.map(id => ({ courseID: id.replace(/\s+/g, '') })) : [];
    }
  
    return {
      id: `${department}${code}`,
      department: department,
      code: code,
      title: codeAndTitleMatch ? codeAndTitleMatch[3].trim() : "",
      credits: codeAndTitleMatch ? parseInt(codeAndTitleMatch[4]) : 0,
      description: descriptionMatch ? descriptionMatch[1].trim() : "",
      requirements: {
        prerequisite: prerequisiteMatch ? prerequisiteMatch[1] : "",
        corequisite: corequisiteMatch ? corequisiteMatch[1] : "",
        mutuallyExclusive: mutuallyExclusiveMatch ? mutuallyExclusiveMatch[1] : "",
        equivTo: equivToMatch ? equivToMatch[1] : "",
        note: noteMatch ? noteMatch[1].trim() : ""
      },
      attributes: attributesMatch ? attributesMatch[1].trim() : ""
    };
}


// EXTRACT_COURSE_INFO() function tests
function testEmptyIDs(){
    for(let i=0; i<RAW_DATA.length; i++){
        //console.log(RAW_DATA[i]);
        //console.log(COURSE_DATA[i]);
        //console.log(JSON.stringify(COURSE_DATA[i]));
        if (COURSE_DATA[i].id === ''){
            console.log(COURSE_DATA[i]);
            console.log(RAW_DATA[i]);
        }
    }
}


// PARSING COURSE REQUIREMENTS and its HELPER FUNCTIONS

/**
 * NAME: removeOuterBrackets
 * PURPOSE: Removes outer brackets from a string.
 * INPUT: text (string) - The input string with potential outer brackets.
 * OUTPUT: (string) - The string with outer brackets removed and trimmed.
 */
function removeOuterBrackets(text) {
  const openingBracket = new Set(["[", "{", "("]);
  const closingBracket = new Set(["]", "}", ")"]);
  let start = 0;
  let end = text.length - 1;

  // Return trimmed text if no brackets present
  if (!openingBracket.has(text[start]) || !closingBracket.has(text[end])) {
    return text.trim();
  }

  // Find first non-opening bracket from start
  while (!openingBracket.has(text[start])) start++;

  // Find first non-closing bracket from end
  while (!closingBracket.has(text[end])) end--;

  // Return substring without outer brackets
  return text.substring(start + 1, end);
}


/**
 * NAME: extractCourseIDs
 * PURPOSE: Extracts course IDs from a string, handling specific numbers and general levels.
 * INPUT: text (string) - The input string containing course information.
 * OUTPUT: (string) - The first extracted course ID, formatted without spaces.
 */
function extractCourseIDs(text) {
  if (!text) return [];

  // Match specific course numbers
  let matches = text.match(/[A-Z]{3,4}\s*\d{4}/g);

  if (matches === null) {
    // Match general level courses like "2000 level"
    const pattern = /\b([A-Z]{3,4})\b.*?(\d)000\s+level/i;
    const levelMatch = text.match(pattern);

    if (levelMatch) {
      const dept = levelMatch[1].toUpperCase();
      const level = levelMatch[2];
      matches = [`${dept}${level}XXX`];
    }
  }

  if (matches === null) {
    return matches;
  }

  // Return the first match without spaces
  return matches[0].replace(/\s+/g, '');
}


function requirementParser(input) {
  // function to find if 'or' or 'and' not enclosed in parentheses
  const containsOrOrAndOutsideBrackets = (text) => {
    // Remove all content inside any type of brackets
    const simplifiedText = text.replace(/\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\}/g, '');
    // Check for 'or' or 'and' in the simplified text
    return /\b(or|and)\b/.test(simplifiedText);
  };

  const splitOnce = (str, keyword) => {
    const regex = new RegExp(`\\s+${keyword}\\s+(?![^\\[]*\\])`, 'i');
    const match = str.match(regex);
    if (match) {
      const index = match.index;
      return [str.slice(0, index), str.slice(index + match[0].length)];
    }
    return [str];
  }
  

  //console.log(`${containsOrOrAndOutsideBrackets(input)} : ${input}`);
  if (!containsOrOrAndOutsideBrackets(input)){
    input = removeOuterBrackets(input);
    //console.log(input);
  }
  //console.log(input);

  // Split by top-level AND
  const andParts = splitOnce(input,"and");

  if (andParts.length > 1) {
    return {
      operator: 'AND',
      courseID: andParts.map(part => requirementParser(part))
    };
  }

  // If no top-level AND, check for OR
  const orParts = splitOnce(input,'or');

  if (orParts.length > 1) {
    console.log(orParts);
    return {
      operator: 'OR',
      courseID: orParts.map(part => requirementParser(part))
    };
  }

  // If no AND or OR, it's a leaf condition
  return { courseID: extractCourseIDs(input) };
}


//assume: indices is in ascending order
function splitStringByIndices(str,indices){
  const strLen = str.length;
  let result = [];
  if(strLen <= 1){
    return [str];
  }
  //make sure indices start with 0 and ends with strLen-1
  if(indices.length > 0){
    if(indices[0]!==0){
      //add 0 at first
      indices.unshift(0);
    }
    if(indices[indices.length-1]<strLen && indices[indices.length-1] !== strLen-1){
      indices.push(strLen-1);
    }
  }else{
    return [str];
  }

  //start spliting the str
  for(let i=0; i<indices.length-1; i++){
    result.push(str.slice(indices[i],indices[i+1]));
  }

  return result;
}

function groupBrackets(str){
  const bracketPairs = {"{":"}","[":"]","(":")"};
  const openingBracket = new Set(["[", "{", "("]);
  const closingBracket = new Set(["]", "}", ")"]);
  let openBrackets = [];
  let breakingIndices = [];
  let notMarked = true; //flag to not split a word that is not enclosed by brackets char by char

  for(let i=0; i<str.length; i++){
    //console.log(`${i} : ${openBrackets}`);
    const char = str[i];

    if(openingBracket.has(char)){
      // if new bracket is opened then add it to the stack and toggle hasSplit
      notMarked = true;         //signifies a new bracket is opened so do not mark an index to split unless it is closed
      openBrackets.push(char);
    }else if(closingBracket.has(char)){
      // if its a closing bracket check if it closes any previous bracket
      const lastOpenBracket = openBrackets[openBrackets.length-1];
      if(bracketPairs[lastOpenBracket] === char){
        //it closes the last bracket so pop it
        openBrackets.pop();
      }
    }

    if(openBrackets.length == 0 && i < str.length-1 && notMarked){
      breakingIndices.push(i+1);
      notMarked = false;
    }
  }

  //return breakingIndices;
  return splitStringByIndices(str,breakingIndices);
}



//---------------------------------------------------------------------------------------------------------------------------------------
function basicTests(){
// TEMPORARY TESTS for "PARSING COURSE REQUIREMENTS"
  //const ans = removeOuterBrackets("[(COMP 2150 or ECE 3740) or ((COMP 2140 or the former COMP 2061) and 3 credit hours of MATH courses at the 2000 level)]sdfsd.");
  //console.log(ans);

  // Example usage
  const text = "[(COMP 2150 or ECE 3740) or ((COMP 2140 or the former COMP 2061) and 3 credit hours of MATH courses at the 2000 level)] and [one of MATH 1220, MATH 1300 (B), MATH 1301 (B), MATH 1310 (B), MATH 1210 (B), or MATH 1211 (B)] and [one of MATH 1230, MATH 1500 (B), MATH 1501 (B), MATH 1510 (B), the former MATH 1520 (B), or MATH 1524 (B)]";
  const testText = "[[COMP 2150 and COMP 2080] or [ECE 3740 and ECE 3790]] and [one of STAT 1150, STAT 1000, STAT 1001, STAT 2220, or PHYS 2496].";
  // console.log(JSON.stringify(requirementParser(testText),null,2));
  //const result = requirementParser(text);
  //console.log(JSON.stringify(result, null, 2));

  //TEST extractCourseIDs()
  const courseIdTests = ["3 credit hours of MATH courses at the 2000 level","MATH 1300 (B)","MATH 1500 )"];
  //courseIdTests.forEach(element => console.log(extractCourseIDs(element)));

  //console.log("Test 1:", splitStringByIndices("abcdefg", [2, 4]));
  // Expected output: ["ab", "cd", "efg"]

  console.log(groupBrackets(text));
}

// MAIN FUNCTION
async function main(){
  await scrapeCourseData();
  setTimeout(()=>console.log(COURSE_DATA["COMP3010"]),1000);
}
//main();

basicTests();