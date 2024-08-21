const axios = require('axios');
const cheerio = require('cheerio');
const courseHtmlIdentifier = ".courseblock";

let data;

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
    console.log("---------------------------------------");
    const childElement = $(element).children();
    //console.log(childElement);
    childElement.each((i,child) => {
        console.log($(child).text());
        console.log("||||||||||||||||");
    });
  });
})
.catch((error) => {
  console.log(error);
});


function createCourseBlock(courseName,courseID,courseCreditHours,courseDescription,courseReq){
    return {
        name: courseName,
        id: courseID,
        credit: courseCreditHours,
        description: courseDescription,
        requirements: courseReq,
    }
}



