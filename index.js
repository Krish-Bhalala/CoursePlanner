const axios = require('axios');
const cheerio = require('cheerio');
const courseHtmlIdentifier = ".courseblock";

let COURSE_DATA = [];
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
    COURSE_DATA.push(structuredData) 
    RAW_DATA.push(cleanData);
  });
  testDATA();
})
.catch((error) => {
  console.log(error);
});

function cleanCourseText(text) {
    const cleaningRules = [
      { pattern: /Prerequisite(?:s)?:/i, replacement: "PREREQ:" },
      { pattern: /Pre(?:\s*-\s*)?req(?:uisite)?(?:s)?:/i, replacement: "PREREQ:" },
      { pattern: /Corequisite(?:s)?:/i, replacement: "COREQ:" },
      { pattern: /Pre- or corequisite(?:s)?:/i, replacement: "PRECOREQ:" },
      { pattern: /Mutually Exclusive:/i, replacement: "MUTEXCL:" },
      { pattern: /May not be held with/i, replacement: "MUTEXCL:" },
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
  
    const codeAndTitlePattern = /^([A-Z]{4})\s+(\d{4})\s+(.+?)\s+(\d+)\s*cr/;
    const descriptionPattern = /\d+\s*cr\s+(.+?)(?=PREREQ:|COREQ:|MUTEXCL:|ATTR:|NOTE:|$)/s;
    const prerequisitePattern = /PREREQ:\s*(.+?)(?=COREQ:|MUTEXCL:|ATTR:|NOTE:|$)/;
    const corequisitePattern = /COREQ:\s*(.+?)(?=PREREQ:|MUTEXCL:|ATTR:|NOTE:|$)/;
    const mutuallyExclusivePattern = /MUTEXCL:\s*(.+?)(?=ATTR:|NOTE:|$)/;
    const attributesPattern = /ATTR:\s*(.+?)$/;
    const notePattern = /NOTE:\s*(.+?)(?=PREREQ:|COREQ:|MUTEXCL:|ATTR:|$)/;
  
    const codeAndTitleMatch = cleanedText.match(codeAndTitlePattern);
    const descriptionMatch = cleanedText.match(descriptionPattern);
    const prerequisiteMatch = cleanedText.match(prerequisitePattern);
    const corequisiteMatch = cleanedText.match(corequisitePattern);
    const mutuallyExclusiveMatch = cleanedText.match(mutuallyExclusivePattern);
    const attributesMatch = cleanedText.match(attributesPattern);
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
        prerequisite: extractCourseIDs(prerequisiteMatch ? prerequisiteMatch[1] : ""),
        corequisite: extractCourseIDs(corequisiteMatch ? corequisiteMatch[1] : ""),
        mutuallyExclusive: extractCourseIDs(mutuallyExclusiveMatch ? mutuallyExclusiveMatch[1] : ""),
        note: noteMatch ? noteMatch[1].trim() : ""
      },
      attributes: attributesMatch ? attributesMatch[1].trim() : ""
    };
}
  
  
function testDATA(){
    for(let i=0; i<RAW_DATA.length; i++){
        //console.log(RAW_DATA[i]);
        console.log(JSON.stringify(COURSE_DATA[i]));
    }
}