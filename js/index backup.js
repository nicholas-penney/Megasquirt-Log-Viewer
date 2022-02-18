/**************************************
 *                                    *
 * Main script for Bryn Datalogging   *
 *                                    *
 *************************************/

/*      Global vars     */

let targetObj = null;
let logObj = null;
let loading = true;

/*      Utils     */

const log = (m) => console.log(m)

window.onload = () => {
  log("Loaded.");
  initFileLoader('target');
  initFileLoader('log');
  loadTargetFromStorage();
  loadDefault();
  //topo();
};

function loadTargetFromStorage() {
  const key = 'targetObj';
  const text = localStorage.getItem(key);
  if (text) {
    const parsed = JSON.parse(text);
    if (parsed) {
      targetObj = parsed;
      // Generate target graph
      drawTargetGraph(parsed);
    }
  }
}

/*      Debugging/Testing     */

function loadDefault() {
  log("Drawing graph.");
  Plotly.newPlot("gd", {
    data: [{ y: [1, 2, 3] }],
    layout: { width: 600, height: 400 },
  });
}

function topo(csvData) {
  const rows = d3.csvParse(csvData);
  function unpack(rows, key) {
    return rows.map(function (row) {
      return row[key];
    });
  }

  var z_data = [];
  for (i = 0; i < 24; i++) {
    z_data.push(unpack(rows, i));
  }

  var data = [
    {
      z: z_data,
      type: "surface",
    },
  ];

  var layout = {
    title: "Megaspaff Log",
    autosize: false,
    width: 500,
    height: 500,
    margin: {
      l: 65,
      r: 50,
      b: 65,
      t: 90,
    },
  };
  Plotly.newPlot("gd", data, layout);
}

/*      Fiel load listener      */

function initFileLoader(elId) {
  const inputSelector = `${elId}-file-input`;
  log(inputSelector);
  document.getElementById(inputSelector).addEventListener('change', function() {
    log('In change listener');
    var all_files = this.files;
    if (all_files.length == 0) {
      alert('Error : No file selected');
      return;
    }
  
    // First file selected by user
    var file = all_files[0];
  
    // Files types allowed
    const csvMime = 'application/vnd.ms-excel';
    var allowed_types = [ csvMime ];
    if(allowed_types.indexOf(file.type) == -1) {
      log("Invalid file format: " + file.type);
      //return;
    }
  
    // Max 30 MB allowed
    const maxMb = 30;
    const max_size_allowed = maxMb*1024*1024
    if(file.size > max_size_allowed) {
      alert('Error : Exceeded size ' + maxMb + ' MB');
      //return;
    }
  
    var reader = new FileReader();
    const labelSelector = `${elId}-file-label`;
    log(labelSelector);

    // File reading started
    reader.addEventListener('loadstart', function() {
      log('Load start');
      document.getElementById(labelSelector).style.opacity = '0.5'; 
      loading = true;
    });
  
    // File reading finished successfully
    reader.addEventListener('load', function(e) {
        log('Loaded!');
        var text = e.target.result;
  
        // Contents of the file
        document.getElementById(labelSelector).style.opacity = '1'; 

        if (elId === "target") {
          log('if target');
          // Generate data from CSV file
          const csvObj = parseTargetCsv(text);
          if (csvObj) {
            drawTargetGraph(csvObj);
          }
        } else if (elId === "log") {
          log('if log');
          // Generate data log MS Log file
          log('TO DO: Code for log file...');
        } else {
          log('if FAIL');
        }
        loading = false;
    });
  
    // File reading failed
    reader.addEventListener('error', function() {
        alert('Error : Failed to read file');
        loading = false;
    });
  
    // File read progress 
    reader.addEventListener('progress', function(e) {
        if(e.lengthComputable == true) {
          const progressSelector = `${elId}-file-progress-percent`;
          document.getElementById(progressSelector).innerHTML = Math.floor((e.loaded/e.total)*100);
          document.getElementById(progressSelector).style.display = 'block';
        }
    });
  
    // Read as text file
    reader.readAsText(file);
  });
  log('Finished loader');
}

/*      File handlers     */

function parseTargetCsv(text) {
  const rowsRaw = text.split('\n');
  const myArr = [];
  let header = [];
  let rows = {};
  let colCount = null;
  let colError = false;
  for (let i=0; i<rowsRaw.length; i++) {
    // Split data
    const rowText = rowsRaw[i];
    const cols = rowText.split(',');
    // Data integrity check
    const currentColCount = cols.length;
    if (colCount === null) colCount = currentColCount;
    if (colCount !== currentColCount) {
      // Error
      colError;
      break;
    }
    // Parse data
    const load = cols[0];
    if (load === '' || load === null) {
      // Header 
      cols.shift();
      header = cols;
    } else {
      // Data
      let afrs = cols;
      afrs.shift();
      rows[load] = afrs;
    }
  }
  if (colError) {
    // Announce error
    handleCsvError();
    return null;
  }
  return { header, rows };
}


/*      Load graphs     */

function drawTargetGraph(data) {
  log("Drawing target graph.");
  const graphId = 'target-graph';
  Plotly.newPlot(graphId, {
    data: [data],
    layout: { width: 600, height: 400 },
  });
}

/*      Error handling      */

function handleCsvError() {
  log('Error parsin CSV.');
}