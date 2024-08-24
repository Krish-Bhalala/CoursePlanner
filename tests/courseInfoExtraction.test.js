const { scrapeCourseData } = require('../src/index');

describe('Course Information Extraction', () => {
  test('No courses should have empty IDs', () => {
    let COURSE_DATA = scrapeCourseData();
    const coursesWithEmptyIDs = COURSE_DATA.filter(course => course.id === '');
    
    if (coursesWithEmptyIDs.length > 0) {
      console.log('Courses with empty IDs:');
      coursesWithEmptyIDs.forEach((course, index) => {
        console.log(`Course ${index + 1}:`);
        console.log(JSON.stringify(course, null, 2));
        console.log('Raw Data:');
        console.log(RAW_DATA[COURSE_DATA.indexOf(course)]);
        console.log('---');
      });
    }

    expect(coursesWithEmptyIDs.length).toBe(0);
  });
});
