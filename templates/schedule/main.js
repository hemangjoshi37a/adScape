function sortTable(column) {
  // get the table and the rows
  var table = document.getElementById("ad-table");
  var rows = table.rows;

  // get the rows as an array
  var rowArray = Array.prototype.slice.call(rows, 1);

  // sort the array based on the specified column
  rowArray.sort(function(rowA, rowB) {
    // get the values for the specified column for each row
    var valueA = rowA.cells[column].innerHTML;
    var valueB = rowB.cells[column].innerHTML;

    // sort the rows based on the values
    if (valueA < valueB) {
      return -1;
    }
    if (valueA > valueB) {
      return 1;
    }
    return 0;
  });

  // clear the table body
  table.tBodies[0].innerHTML = "";

  // add the sorted rows back to the table
  rowArray.forEach(function(row) {
    table.tBodies[0].appendChild(row);
  });
}

function editAd(id) {
  // Get the values from the form
  var startTime = document.getElementById("edit-start-time").value;
  var endTime = document.getElementById("edit-end-time").value;
  var adName = document.getElementById("edit-ad-name").value;
  var adDescription = document.getElementById("edit-ad-description").value;
  var adFile = document.getElementById("edit-ad-file").files[0];

  // Create a FormData object to send the data to the server
  var data = new FormData();
  data.append("id", id);
  data.append("start_time", startTime);
  data.append("end_time", endTime);
  data.append("ad_name", adName);
  data.append("ad_description", adDescription);
  data.append("ad_file", adFile);

  // Send the data to the server
  var cnx = new XMLHttpRequest();
  cnx.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // Update the table row with the new data
      var row = document.getElementById("ad-" + id);
      row.cells[1].innerHTML = startTime;
      row.cells[2].innerHTML = endTime;
      row.cells[3].innerHTML = adName;
      row.cells[4].innerHTML = adDescription;
      row.cells[5].innerHTML = adFile.name;
    }
  };
  cnx.open("POST", "/edit", true);
  cnx.send(data);
}

// Send an AJAX request to the /fetchdata.py route to retrieve the data from the database
function getData() {
  var cnx = new XMLHttpRequest();
  cnx.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // Parse the JSON data
      var data = JSON.parse(this.responseText);
      // Loop through the data and add a row to the table for each ad
      for (var i = 0; i < data.length; i++) {
        var ad = data[i];
        var row = document.createElement("tr");
        row.innerHTML = "<td>" + ad.id + "</td>" +
                        "<td>" + ad.ad_start_time + "</td>" +
                        "<td>" + ad.ad_end_time + "</td>" +
                        "<td>" + ad.ad_name + "</td>" +
                        "<td>" + ad.ad_description + "</td>" +
                        "<td>" + ad.file_name + "</td>" +
                        "<td>" + ad.ad_type + "</td>" +
                        "<td><a href='#' onclick='previewAd(" + ad.id + ")'>Preview</a> | <a href='#' onclick='editAd(" + ad.id + ")'>Edit</a> | <a href='#' onclick='deleteAd(" + ad.id + ")'>Delete</a></td>";
        document.getElementById("ads-table-body").appendChild(row);
      }
    }
  };
  cnx.open("GET", "/fetchdata", true);
  cnx.send();
}


// Call the getData function after the page has finished loading
window.onload = function() {
  getData();
}
window.addEventListener("load", getData);

