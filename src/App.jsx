import React from "react";
import Papa from "papaparse";

function App() {
  const changeHandler = (event) => {
    // Passing file data (event.target.files[0]) to parse using Papa.parse
    Papa.parse(event.target.files[0], {
      header: false,
      skipEmptyLines: true,
      complete: function (rows) {
        const projectsEmpData = new Map();

        // Iterating through the CSV data
        rows.data.map((row) => {
          let employeeId = row[0].trim();
          let projectId = row[1].trim();
          let dateFrom = new Date(row[2].trim());
          let dateTo = "NULL" === row[3].trim() ? new Date() : new Date(row[3].trim());

          let rowObj = {
            employeeId: employeeId,
            dateFrom: dateFrom,
            dateTo: dateTo,
          };
          
          // Grouping the employees data by projects 
          if (projectsEmpData.has(projectId)){
            let prevEmpData = projectsEmpData.get(projectId);
            
            prevEmpData.forEach((empData) => {
              if (dateFrom <= empData.dateTo && dateTo >= empData.dateFrom) {
                // both employees have worked together
                let overlap = Math.min(
                  (dateTo - dateFrom), 
                  (dateTo - empData.dateFrom), 
                  (empData.dateTo - dateFrom), 
                  (empData.dateTo - empData.dateFrom)
                );
                console.log(Math.ceil( overlap / (1000 * 3600 * 24)));
              }
            })
            prevEmpData.push(rowObj);

            projectsEmpData.set(projectId, prevEmpData);
          } else {
            projectsEmpData.set(projectId, [rowObj]);
          }

        });

        console.log(projectsEmpData);
      },
    });
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
