import React from "react";
import Papa from "papaparse";

function App() {
  const changeHandler = (event) => {
    // Passing file data (event.target.files[0]) to parse using Papa.parse
    Papa.parse(event.target.files[0], {
      header: false,
      skipEmptyLines: true,
      complete: function (rows) {

        // usuing projectId (key) to find all employees working on a given project
        const projectsEmpData = new Map();

        // using emplayee pair to find total working days
        // key is in the form of '{empId1}-{empId2}'
        const empPairDays = new Map();

        // using emplayee pair to find common projects and days worked
        // key is in the form of '{empId1}-{empId2}'
        const empPairProjects = new Map();

        // storing data for the longest period of time that a pair has worked
        let maxTotalDays = 0;

        // key of the pair(s) that has worked for the longest period of time
        // we may have a few pairs of employees that have worked for the exact same period of time
        let empPairKeys = [];


        // Iterating through the CSV data
        rows.data.map((rowData) => {
          let employeeId = rowData[0].trim();
          let projectId = rowData[1].trim();
          let dateFrom = new Date(rowData[2].trim());
          let dateTo = "NULL" === rowData[3].trim() ? new Date() : new Date(rowData[3].trim());

          let rowObj = {
            employeeId: employeeId,
            dateFrom: dateFrom,
            dateTo: dateTo,
          };
          
          // Grouping the employees data by projects 
          if (projectsEmpData.has(projectId)){
            let prevEmpData = projectsEmpData.get(projectId);
            
            
            for (let i = 0; i < prevEmpData.length; i++) {
              const empData = prevEmpData[i];

              if (employeeId === empData.employeeId) break;
              if (dateFrom <= empData.dateTo && dateTo >= empData.dateFrom) {
                // both employees have worked together

                const overlap = Math.min(
                  (dateTo - dateFrom), 
                  (dateTo - empData.dateFrom), 
                  (empData.dateTo - dateFrom), 
                  (empData.dateTo - empData.dateFrom)
                );
                const overlapDays = Math.ceil( overlap / (1000 * 3600 * 24));
                const empKey = generateEmpKey(employeeId, empData.employeeId);

                const pairProjectObj = {
                  projectId: projectId,
                  daysWorked: overlapDays,
                };


                // adding data to empPairProjects
                if (empPairProjects.has(empKey)) {
                  let prevPairProjects = empPairProjects.get(empKey);
                  prevPairProjects.push(pairProjectObj);
                  empPairProjects.set(empKey, prevPairProjects);
                } else {
                  empPairProjects.set(empKey, [pairProjectObj]);
                }

                // adding data to empPairDays
                let updatedPairDays;
                if (empPairDays.has(empKey)) {
                  updatedPairDays = empPairDays.get(empKey);
                  updatedPairDays += overlapDays;
                  empPairDays.set(empKey, updatedPairDays);
                } else {
                  updatedPairDays = overlapDays;
                  empPairDays.set(empKey, overlapDays);
                }

                // check if pair days are more than the current max (maxTotalDays)
                if (updatedPairDays > maxTotalDays) {
                  // overriding maxTotalDays and clearing empPairKeys
                  maxTotalDays = updatedPairDays;
                  empPairKeys = [empKey];
                }
                if (updatedPairDays === maxTotalDays) {
                  // there is another pair with the same total number of days => adding to empPairKeys
                  empPairKeys.push(empKey);
                }
              }
            }
            prevEmpData.push(rowObj);

            projectsEmpData.set(projectId, prevEmpData);
          } else {
            projectsEmpData.set(projectId, [rowObj]);
          }

        });

        // TODO: group grid data for pair projects
        console.log(projectsEmpData);
        console.log(empPairDays);
        console.log(empPairProjects);
        console.log(maxTotalDays);
        console.log(empPairKeys);
      },
    });
  };

  // generates emp key pair
  const generateEmpKey = (emp1, emp2) => {
    let emp1Num = parseInt(emp1);
    let emp2Num = parseInt(emp2);

    if (emp1Num === emp2Num) {
      return;
    } else if (emp1Num > emp2Num) {
      return `${emp1Num}-${emp2Num}`
    } else {
      return `${emp2Num}-${emp1Num}`
    } 
  };

  return (
    <div>
      {/* File Uploader */}
      <input
        type="file"
        name="file"
        onChange={changeHandler}
        accept=".csv"
        style={{ display: "block", margin: "10px auto" }}
      />
    </div>
  );
}

export default App;
