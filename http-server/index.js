// const http = require("http");
// const fs = require("fs");

// // Read the "home.html" file
// fs.readFile("home.html", (err, homeContent) => {
//   if (err) {
//     throw err;
//   }

//   // Log the content to the console
//   console.log(homeContent.toString());

//   // Create an HTTP server
//   http.createServer((request, response) => {
//     // Set the response headers
//     response.writeHead(200, { "Content-Type": "text/html" });

//     // Write the content of "home.html" to the response
//     response.write(homeContent);

//     // End the response
//     response.end();
//   }).listen(3000, () => {
//     console.log("Server is listening on port 3000");
//   });
// });
const http = require("http");
const fs = require("fs");

let homeContent = "";
let projectContent = "";

fs.readFile("home.html", (err, home) => {
  if (err) {
    throw err;
  }
  homeContent = home;
});

fs.readFile("project.html", (err, project) => {
  if (err) {
    throw err;
  }
  projectContent = project;
});
http
  .createServer((request, response) => {
    let url = request.url;
    response.writeHeader(200, { "Content-Type": "text/html" });
    switch (url) {
      case "/project":
        response.write(projectContent);
        response.end();
        break;
      default:
        response.write(homeContent);
        response.end();
        break;
    }
  })
  .listen(3000);

