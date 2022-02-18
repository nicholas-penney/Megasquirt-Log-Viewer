let csvData = null;

let loading = true;

window.onload = () => {
  console.log("Loaded.");
  initFileLoader();
  topo();
};

function loadDefault() {
  console.log("Drawing graph.");
  Plotly.newPlot("gd", {
    data: [{ y: [1, 2, 3] }],
    layout: { width: 600, height: 400 },
  });
}

function topo() {
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


function log(m) {
  console.log(m);
}

function initFileLoader() {
  document.querySelector("#file-input").addEventListener('change', function() {
    // 
    var all_files = this.files;
    if(all_files.length == 0) {
      alert('Error : No file selected');
      return;
    }
  
    // First file selected by user
    var file = all_files[0];
  
    // Files types allowed
    var allowed_types = [ 'application/vnd.ms-excel' ];
    if(allowed_types.indexOf(file.type) == -1) {
      log("Invalid file format: " + file.type);
      //return;
    }
  
    // Max 30 MB allowed
    var max_size_allowed = 30*1024*1024
    if(file.size > max_size_allowed) {
      alert('Error : Exceeded size 30 MB');
      //return;
    }
  
    var reader = new FileReader();
  
    // file reading started
    reader.addEventListener('loadstart', function() {
      document.querySelector("#file-input-label").style.opacity = '0.5'; 
      loading = true;
    });
  
    // file reading finished successfully
    reader.addEventListener('load', function(e) {
        var text = e.target.result;
  
        // contents of the file
        document.querySelector("#file-input-label").style.opacity = '1'; 

        csvData = text;
        topo();
        loading = false;
    });
  
    // file reading failed
    reader.addEventListener('error', function() {
        alert('Error : Failed to read file');
        loading = false;
    });
  
    // file read progress 
    reader.addEventListener('progress', function(e) {
        if(e.lengthComputable == true) {
          document.querySelector("#file-progress-percent").innerHTML = Math.floor((e.loaded/e.total)*100);
          document.querySelector("#file-progress-percent").style.display = 'block';
        }
    });
  
    // read as text file
    reader.readAsText(file);
  });
}