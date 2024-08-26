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

function refactorRequirements(){
  
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


//EXTRACT_COURSE_INFO() function tests
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

async function main(){
  await scrapeCourseData();
  setTimeout(()=>console.log(COURSE_DATA["COMP3010"]),1000);
}
//main();


function parsePrerequisites(text) {
  // Remove unnecessary characters and split into main sections
  const sections = text.replace(/[\[\]]/g, '').split(/\s*and\s*/);

  function parseSection(section) {
    if (section.includes('or')) {
      const parts = section.split(/\s*or\s*/);
      return {
        "ONE_OF": parts.map(part => parseSection(part.trim()))
      };
    } else if (section.includes('and')) {
      const parts = section.split(/\s*and\s*/);
      return {
        "AND": parts.map(part => parseSection(part.trim()))
      };
    } else if (section.includes('credit hours')) {
      const match = section.match(/(\d+)\s*credit hours of ([A-Z]{4}) courses at the (\d+)/);
      if (match) {
        return { [`${match[2]}${match[3]}XX`]: parseInt(match[1]) };
      }
    } else {
      // Remove grade requirements and spaces from course codes
      return section.replace(/\s*\([A-Z]\)\s*/g, '').replace(/\s+/g, '');
    }
  }

  const prerequisites = sections.map(section => parseSection(section.trim()));

  return { prerequisites };
}

// Example usage
const text = "[(COMP 2150 or ECE 3740) or ((COMP 2140 or the former COMP 2061) and 3 credit hours of MATH courses at the 2000 level)] and [one of MATH 1220, MATH 1300 (B), MATH 1301 (B), MATH 1310 (B), MATH 1210 (B), or MATH 1211 (B)] and [one of MATH 1230, MATH 1500 (B), MATH 1501 (B), MATH 1510 (B), the former MATH 1520 (B), or MATH 1524 (B)]";
const testText = "[[COMP 2150 and COMP 2080] or [ECE 3740 and ECE 3790]] and [one of STAT 1150, STAT 1000, STAT 1001, STAT 2220, or PHYS 2496].";
requirementParser(text);
// const result = parsePrerequisites(text);
// console.log(JSON.stringify(result, null, 2));

function removeEndBrackets(text){
  const openingBracket = new Set(["[","{","("]);
  const closingBracket = new Set(["]","}",")"]);
  let openingCleaned = false;
  let closingCleaned = false;
  let start = 0;
  let end = text.length-1;
  while (!openingCleaned || !closingCleaned){
    if(!openingCleaned){
      if(openingBracket.has(text[start])){
        openingCleaned = true
      }else{
        start++;
      }
    }
    if(!closingCleaned){
      if(closingBracket.has(text[end])){
        closingCleaned = true
      }else{
        end--;
      }
    }
  }

  return text.substring(start+1, end);
}

function requirementParser(input){
  const parts = input.split(/\s+and\s+(?![^\[]*\])/);
  parts.map((element) => {
    element
  });
  //console.log(parts);
}

const ans = removeEndBrackets("[(COMP 2150 or ECE 3740) or ((COMP 2140 or the former COMP 2061) and 3 credit hours of MATH courses at the 2000 level)].");
console.log(ans);