import React, { useState } from "react";
import Papa from "papaparse";

function App() {
  const [values, setValues] = useState([]);
  const [maxDays, setMaxDays] = useState(null);

  const changeHandler = (event) => {
    if (event.target.files[0].size > 3145728 ) {
      alert("File size is too large");
    }

    // passing file data (event.target.files[0]) to parse using Papa.parse
    Papa.parse(event.target.files[0], {
      header: false,
      skipEmptyLines: true,
      complete: function (rows) {

        // using projectId (key) to find all employees working on a given project
        // value is an array of objects (employees) containing employeeId, dateFrom, dateTo
        const projectsEmpData = new Map();

        // using emplayee pair to find common projects and days worked
        // key is in the form of '{empId1}-{empId2}'
        // value is an array of objects (projects) containing projectId, daysWorked
        const empPairProjects = new Map();

        //  using emplayee pair to find total working days
        //  key is in the form of '{empId1}-{empId2}'
        // values is a number (total days worked)
        const empPairDays = new Map();

        // storing data for the longest period of time that a pair has worked
        let maxTotalDays = 0;

        // key of the pair(s) that has worked for the longest period of time
        // we may have a few pairs of employees that have worked for the exact same period of time
        let empPairKeys = [];

        const rowsData = rows.data;
        // iterating through the CSV data
        for (let i = 0; i < rowsData.length; i++) {
          const rowData = rowsData[i];
          if (rowData.length !== 4) continue; // skipping invalid rows

          let employeeId = rowData[0].trim();
          let projectId = rowData[1].trim();
          let dateFrom = new Date(rowData[2].trim());
          let dateTo = "NULL" === rowData[3].trim() 
            ? new Date(new Date().toDateString())
            : new Date(rowData[3].trim());
          
          if (dateTo < dateFrom) continue; // skipping invalid dates

          let rowObj = {
            employeeId: employeeId,
            dateFrom: dateFrom,
            dateTo: dateTo,
          };
          
          // grouping the employees data by projects 
          if (projectsEmpData.has(projectId)){
            let prevEmpData = projectsEmpData.get(projectId);
            
            for (let i = 0; i < prevEmpData.length; i++) {
              const empData = prevEmpData[i];

              if (employeeId === empData.employeeId) continue;
              // checking if the employees have worked together
              if (dateFrom <= empData.dateTo && dateTo >= empData.dateFrom) {
                // both employees have worked together
                const overlap = Math.min(
                  (dateTo - dateFrom), 
                  (dateTo - empData.dateFrom), 
                  (empData.dateTo - dateFrom), 
                  (empData.dateTo - empData.dateFrom)
                );
                const overlapDays = Math.ceil( overlap / (1000 * 3600 * 24)) + 1;
                const empKey = generateEmpKey(employeeId, empData.employeeId);

                const pairProjectObj = {
                  projectId,
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
                } else if (updatedPairDays === maxTotalDays) {
                  // there is another pair with the same total number of days => adding to empPairKeys
                  empPairKeys.push(empKey);
                }
              }
            }

            // updating the project data
            prevEmpData.push(rowObj);
            projectsEmpData.set(projectId, prevEmpData);
          } else {
            // adding data for the project
            projectsEmpData.set(projectId, [rowObj]);
          }
        }

        const values = getGridData(empPairKeys, empPairProjects);
        setValues(values);
        setMaxDays(maxTotalDays);
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
      return `${emp2Num}-${emp1Num}`
    } else {
      return `${emp1Num}-${emp2Num}`
    } 
  };

  // group the grid data
  const getGridData = (empPairKeys, empPairProjects) => {
    const values = [];

    empPairKeys.map((empPairKey) => {
      const currEmpPairProjects = empPairProjects.get(empPairKey); // get all pair projects
      const empIds = empPairKey.split('-'); // get the employee pair ids

      currEmpPairProjects.forEach(currEmpPairProject => {
        const empId1 = empIds[0];
        const empId2 = empIds[1];
        const projectId = currEmpPairProject.projectId;
        const daysWorked = currEmpPairProject.daysWorked;

        // check if there is an existing record about this project and employee pair
        // showing only one entry for a given employee pair and project id
        const indexOfSameProject = values.findIndex(
          v => v.projectId === projectId && v.empId1 === empId1 && v.empId2 === empId2);

        if  (indexOfSameProject > -1) {
          // updating the days worked to include the sum of all the days on a given project
          const updatedProjData =  values[indexOfSameProject];
          updatedProjData.daysWorked += daysWorked;
          values[indexOfSameProject] = updatedProjData;
        } else {
          const gridRowObj = {
            empId1,
            empId2,
            projectId,
            daysWorked,
          };
          values.push(gridRowObj);
        }
      });
    });
      
    return values;
  };

  return (
    <div className="relative w-full 
        my-10 mx-auto bg-gray-300
        xs:bg-gray-50 md: py-10
        rounded-lg sm:w-3/5
        shadow-lg"
    >
      {/* File Uploader */}
      <input
          type="file"
          name="file"
          onChange={changeHandler}
          accept=".csv"
          className="mx-auto mb-9 block text-lg text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-lg file:font-semibold
          file:bg-violet-100 file:text-violet-700
          hover:file:bg-violet-300
          hover:file:cursor-pointer"
      />
      <table className="table-auto mx-auto border border-violet-700
        text-left text-gray-500 dark:text-gray-400">
        <thead className="text-gray-700 uppercase bg-violet-300
          dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="border p-2">Employee ID #1</th>
            <th scope="col" className="border p-2">Employee ID #2</th>
            <th scope="col" className="border p-2">Project ID</th>
            <th scope="col" className="border p-2">Days worked</th>
          </tr>
        </thead>
        <tbody>
          {values && values.map((value, index) => {
            return (
              <tr
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"               
                key={index}>
                  {Object.keys(value).map((i) => {
                    return  <td
                              className="py-2 px-4 border" 
                              key={i}>{value[i]}
                            </td>;
                  })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mx-auto w-48 text-gray-600 mt-3">
      {maxDays && maxDays !== 0 
        ? `Total days worked: ${maxDays}` 
        : 'No Total days available'}
      </div>
    </div>
  );
}
export default App;
