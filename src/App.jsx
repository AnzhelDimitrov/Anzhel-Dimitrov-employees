import React from "react";
import Papa from "papaparse";

function App() {
  const changeHandler = (event) => {
    // Passing file data (event.target.files[0]) to parse using Papa.parse
    Papa.parse(event.target.files[0], {
      header: false,
      skipEmptyLines: true,
      complete: function (rows) {
        const projectsData = new Map();

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
          if (projectsData.has(projectId)){
            let updatedProjectData = projectsData.get(projectId);
            updatedProjectData.push(rowObj);

            projectsData.set(projectId, updatedProjectData);
          } else {
            projectsData.set(projectId, [rowObj]);
          }

        });

        console.log(projectsData);
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
