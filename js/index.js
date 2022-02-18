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
  initFileLoader('target');
  initFileLoader('log');
  loadTargetFromStorage();
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
  for (i=0; i<rows.length; i++) {
    z_data.unshift(unpack(rows, i));
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
  const inputSelector = `#${elId}-file-input`;
  document.querySelector(inputSelector).addEventListener('change', function() {
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

    // File reading started
    reader.addEventListener('loadstart', function() {
      document.getElementById(labelSelector).style.opacity = '0.5'; 
      loading = true;
    });
  
    // File reading finished successfully
    reader.addEventListener('load', function(e) {
        var text = e.target.result;
  
        // Contents of the file
        document.getElementById(labelSelector).style.opacity = '1'; 

        if (elId === "target") {
          // Generate data from CSV file
          const csvObj = parseTargetCsv(text);
          if (csvObj) {
            targetObj = csvObj;
            drawTargetGraph(csvObj);
          }
        } else if (elId === "log") {
          // Generate data log MS Log file
          if (!targetObj) {
            log('Missing target map CSV');
          } else {
            //log('TO DO: Code for log file...');
            const rows = parseLogCsv(text);
            if (rows) {
              // rows = [ {x,y,z}, ... ]
              
            }
            // save to storage
          }
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

function parseLogCsv(text) {
  const rowsRaw = text.split('\n');
  let rowsLite = [];
  // Get headers array
  let headers = rowsRaw[2].split('\t');
  // Headers parse error
  if (!headers || headers.length < 2) {
    log('Log header parse error.');
    return null;
  }
  const tempPos = headers.indexOf('CLT'); // 9
  const rpmPos = headers.indexOf('RPM');  // 2
  const mapPos = headers.indexOf('MAP');  // 3
  const afrPos = headers.indexOf('AFR');  // 6

  if (tempPos == -1) {
    log('Temp header not found.');
    return null;
  }

  for (let i=4; i<rowsRaw.length; i++) {
    // Split data
    const rowText = rowsRaw[i];
    const cols = rowText.split('\t');
    // Data integrity check
    const currentColCount = cols.length;
    if (!currentColCount || currentColCount.length < 2) continue;
    // Ignore if temp too low
    const minTemp = 75;
    const temp = cols[tempPos];
    if (temp < minTemp) {
      // Too cold
      continue;
    }

    const rpmX = cols[rpmPos];
    const mapY = cols[mapPos];
    const afrZ = cols[afrPos];

    rowsLite.push({ x: rpmX, y: mapY, z: afrZ });
  }
  return rowsLite;
}


/*      Load graphs     */

function drawTargetGraph(data) {
  const isAfrData = true;
  drawTable("test-table", data, isAfrData);
  const { header, rows } = data;
  const graphId = 'target-graph';
  let csvString = ',';
  const headerString = header.join(',');
  csvString += headerString + '\n';
  for (const [k,v] of Object.entries(rows)) {
    csvString += k + ',';
    let rowString = v.join(',');
    rowString.replaceAll('\r', '');
    csvString += rowString;
    csvString += '\n';
  }
  const len = csvString.length;
  const without = csvString.substr(0, len-2);
  topo(without);
  /*
  Plotly.newPlot(graphId, {
    data: [ data ],
    layout: { width: 600, height: 400 },
  });
  */

}

/*      Draw Tables     */

function drawTable(id, data, isAfrData) {
  let htmlString = "";
  const { header, rows } = data;

  // Table start
  htmlString += '<table class="equal">'
  
  const bp = isAfrData ? {
    h: 14.0,
    m: 13.3,
    l: 12.5
  } : {
    h: 0.5,
    m: 0,
    l: 0.5
  };

  // Rows
  let rowsArr = Object.values(rows).reverse();
  let rowsAxis = Object.keys(rows).reverse();
  for (let i=0; i<rowsAxis.length; i++) {
    const k = rowsAxis[i];
    htmlString += `<tr><td><strong>${k}</strong></td>`;
    const rowArr = rowsArr[i];
    for (let j=0; j<rowArr.length; j++) {
      const val = rowArr[j];
      const inlineStyle = cellColourAdvanced(val, bp);
      htmlString += `<td style="${inlineStyle}">${val}</td>`;
    }
    htmlString += '</tr>';
  }

  /*
  for (const [k,v] of Object.entries(rows)) {
    htmlString += `<tr><td>${k}</td>`;
    for (let i=0; i<v.length; i++) {
      const val = v[i];
      const inlineStyle = cellColourAdvanced(val);
      htmlString += `<td style="${inlineStyle}">${val}</td>`;
    }
    htmlString += '</tr>';
  }
  */

  // Header
  //htmlString += '<thead>';
  htmlString += '<tr><td></td>';
  for (let i=0; i<header.length; i++) {
    htmlString += `<td><strong>${header[i]}</strong></td>`;
  }
  htmlString += "</tr>";
  //htmlString += "</thead>";
  
  htmlString += '</tbody>';

  // Table end
  htmlString += '<table>';
  document.getElementById(id).innerHTML = htmlString;
}

function cellColour(val) {
  if (val >= 13.8) {
    return 'high';
  } else if (val >= 13.2) {
    return 'mid'
  } else if (val >= 11) {
    return 'low'
  }
  return '';
}

function cellColourAdvanced(val, bp) {
  // RGB
  const red = [221, 51, 51];
  const yellow = [187, 187, 68];
  const green = [51, 187, 51];
  // Preset cases
  if (val >= bp.h) return genRgbInlineStyle(red);
  if (val == bp.m) return genRgbInlineStyle(yellow);
  if (val <= bp.l) return genRgbInlineStyle(green);
  // Interpolate
  let from = null;
  let to = null;
  let fromArr = null;
  let toArr = null;
  if (val >= bp.m) {
    // Orange
    from = bp.m;
    to = bp.h;
    fromArr = yellow;
    toArr = red;
  } else if (val >= bp.l) {
    // Lime
    from = bp.l;
    to = bp.m;
    fromArr = green;
    toArr = yellow;
  } else {
    // Error
    return '';
  }
  const range = to - from;
  const pos = val - from;
  const pc = pos/range;
  const iArr = interpolateRgb(fromArr, toArr, pc);
  return genRgbInlineStyle(iArr);
}

function genRgbInlineStyle(arr) {
  // Generate inlien style string for cell bg colour
  return `background-color: rgb(${arr[0]}, ${arr[1]}, ${arr[2]});`;
}

function genPrimaryColour(from, to, pc) {
  // Interpolate single colour
  const range = to - from;
  const add = Math.floor(range * pc);
  return from + add;
}

function interpolateRgb(from, to, pc) {
  // Interpolate RGB array
  let iArr = [];
  for (let i=0; i<from.length; i++) {
    iArr.push(genPrimaryColour(from[i], to[i], pc));
  }
  return iArr;
}

/*      Error handling      */

function handleCsvError() {
  log('Error parsin CSV.');
}